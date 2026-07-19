import "server-only";

import { cache } from "react";
import type { Collection, Filter, Sort } from "mongodb";
import { demoCases } from "@/data/demo-cases";
import { scenarios } from "@/lib/catalog";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { CaseQuery, CaseStudy, PaginatedCases } from "@/lib/types";

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN").replace(/[\s，。！？、：；,.!?:;（）()【】\[\]]+/g, " ");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandSearchTerms(value: string) {
  const normalized = normalizeText(value).slice(0, 100);
  const matchingScenario = scenarios.find((scenario) => {
    const labels = [scenario.slug, scenario.name, ...scenario.synonyms].map(normalizeText);
    return labels.some((label) => label === normalized || label.includes(normalized) || normalized.includes(label));
  });
  return [...new Set([normalized, ...(matchingScenario ? [matchingScenario.name, matchingScenario.slug, ...matchingScenario.synonyms] : [])].map(normalizeText).filter(Boolean))];
}

let atlasTextSearchAvailable = true;
async function searchCasesWithAtlas(collection: Collection<CaseStudy>, filter: Filter<CaseStudy>, query: CaseQuery, page: number, pageSize: number): Promise<PaginatedCases | null> {
  if (!query.q || !atlasTextSearchAvailable) return null;
  const searchSort = query.sort === "popular" ? { views: -1 } : query.sort === "latest" ? { publishedAt: -1 } : { searchScore: -1, publishedAt: -1 };
  try {
    const [result] = await collection.aggregate<{
      items: CaseStudy[];
      total: Array<{ count: number }>;
    }>([
      { $search: { index: "case_search", text: { query: expandSearchTerms(query.q), path: ["title", "organization.name", "summary", "problem", "solution", "scenarios.name", "scenarios.synonyms"] } } },
      { $match: filter },
      { $set: { searchScore: { $meta: "searchScore" } } },
      { $sort: searchSort },
      { $facet: { items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }, { $project: { _id: 0, dedupVector: 0, searchScore: 0 } }], total: [{ $count: "count" }] } },
    ]).toArray();
    const total = result?.total[0]?.count ?? 0;
    return { items: result?.items ?? [], total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), mode: "mongodb" };
  } catch {
    atlasTextSearchAvailable = false;
    return null;
  }
}

function matchesDemo(item: CaseStudy, query: CaseQuery) {
  const needle = query.q ? normalizeText(query.q) : "";
  const haystack = normalizeText([
    item.title,
    item.organization.name,
    item.summary,
    item.problem,
    item.solution,
    item.industry.displayName,
    ...item.scenarios.flatMap((scene) => [scene.name, ...scene.synonyms]),
  ].join(" "));

  return (
    (!needle || haystack.includes(needle) || needle.split(" ").every((part) => haystack.includes(part))) &&
    (!query.industry || item.industry.slug === query.industry) &&
    (!query.scenario || item.scenarios.some((scene) => scene.slug === query.scenario)) &&
    (!query.size || item.organization.size === query.size) &&
    (!query.outcome || query.outcome === "all" || item.outcomeStatus === query.outcome) &&
    (!query.roi || query.roi === "all" || (query.roi === "disclosed" ? !item.roi.includes("未披露") : item.roi.includes("未披露")))
  );
}

function sortDemo(items: CaseStudy[], sort: CaseQuery["sort"], q?: string) {
  return [...items].sort((a, b) => {
    if (sort === "popular") return b.views - a.views;
    if (sort === "latest") return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    if (q) {
      const needle = normalizeText(q);
      const aTitle = normalizeText(a.title).includes(needle) ? 1 : 0;
      const bTitle = normalizeText(b.title).includes(needle) ? 1 : 0;
      if (aTitle !== bTitle) return bTitle - aTitle;
    }
    return Number(b.featured) - Number(a.featured) || b.views - a.views;
  });
}

export async function listCases(query: CaseQuery = {}): Promise<PaginatedCases> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.limit ?? 20));

  if (!isMongoConfigured()) {
    const matching = sortDemo(demoCases.filter((item) => matchesDemo(item, query)), query.sort, query.q);
    return {
      items: matching.slice((page - 1) * pageSize, page * pageSize),
      total: matching.length,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(matching.length / pageSize)),
      mode: "demo",
    };
  }

  const db = await getDb();
  const filter: Filter<CaseStudy> = { contentStatus: "published" };
  if (query.industry) filter["industry.slug"] = query.industry;
  if (query.scenario) filter["scenarios.slug"] = query.scenario;
  if (query.size) filter["organization.size"] = query.size;
  if (query.outcome && query.outcome !== "all") filter.outcomeStatus = query.outcome;
  if (query.roi === "disclosed") filter.roi = { $not: /未披露/ };
  if (query.roi === "undisclosed") filter.roi = /未披露/;

  const collection = db.collection<CaseStudy>("cases");
  const atlasResult = await searchCasesWithAtlas(collection, filter, query, page, pageSize);
  if (atlasResult) return atlasResult;

  if (query.q) {
    const terms = expandSearchTerms(query.q);
    const fields = ["title", "organization.name", "summary", "problem", "solution", "scenarios.name", "scenarios.slug", "scenarios.synonyms"] as const;
    filter.$or = terms.flatMap((term) => fields.map((field) => ({ [field]: { $regex: escapeRegex(term), $options: "i" } }))) as Filter<CaseStudy>[];
  }

  const sort: Sort = query.sort === "popular" ? { views: -1 } : query.sort === "latest" ? { publishedAt: -1 } : { featured: -1, views: -1, publishedAt: -1 };
  const [items, total] = await Promise.all([
    collection.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize).project<CaseStudy>({ _id: 0, dedupVector: 0 }).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), mode: "mongodb" };
}

export const getCaseBySlug = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (!isMongoConfigured()) return demoCases.find((item) => item.slug === slug) ?? null;
  const db = await getDb();
  return db.collection<CaseStudy>("cases").findOne({ slug, contentStatus: "published" }, { projection: { _id: 0, dedupVector: 0 } });
});

export type CaseRouteResolution =
  | { kind: "published"; item: CaseStudy }
  | { kind: "archived"; item: CaseStudy }
  | { kind: "redirect"; targetSlug: string }
  | { kind: "missing" };

export const resolveCaseRoute = cache(async (slug: string): Promise<CaseRouteResolution> => {
  if (!isMongoConfigured()) {
    const item = demoCases.find((entry) => entry.slug === slug);
    return item ? { kind: "published", item } : { kind: "missing" };
  }
  const db = await getDb();
  const item = await db.collection<CaseStudy>("cases").findOne(
    { slug, contentStatus: { $in: ["published", "archived", "merged"] } },
    { projection: { _id: 0, dedupVector: 0 } },
  );
  if (item?.contentStatus === "published") return { kind: "published", item };
  if (item?.contentStatus === "archived") return { kind: "archived", item };
  if (item?.contentStatus === "merged" && item.mergedIntoSlug) return { kind: "redirect", targetSlug: item.mergedIntoSlug };
  const redirect = await db.collection<{ fromSlug: string; targetSlug: string }>("case_redirects").findOne({ fromSlug: slug }, { projection: { _id: 0, targetSlug: 1 } });
  return redirect?.targetSlug ? { kind: "redirect", targetSlug: redirect.targetSlug } : { kind: "missing" };
});

export async function getFeaturedCases(limit = 6) {
  return (await listCases({ sort: "popular", limit })).items;
}

export async function getRelatedCases(caseStudy: CaseStudy, limit = 3) {
  const result = await listCases({ industry: caseStudy.industry.slug, scenario: caseStudy.scenarios[0]?.slug, sort: "popular", limit: limit + 1 });
  return result.items.filter((item) => item.id !== caseStudy.id).slice(0, limit);
}

export async function getPublicStats() {
  if (isMongoConfigured()) {
    const db = await getDb();
    const collection = db.collection<CaseStudy>("cases");
    const [cases, industriesList, scenariosList, sourceResult] = await Promise.all([
      collection.countDocuments({ contentStatus: "published" }),
      collection.distinct("industry.slug", { contentStatus: "published" }),
      collection.distinct("scenarios.slug", { contentStatus: "published" }),
      collection.aggregate<{ total: number }>([{ $match: { contentStatus: "published" } }, { $project: { count: { $size: { $ifNull: ["$sources", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }]).next(),
    ]);
    return { cases, industries: industriesList.length, scenarios: scenariosList.length, sources: sourceResult?.total ?? 0, mode: "mongodb" as const };
  }
  const all = await listCases({ limit: 50 });
  const sourceCount = all.items.reduce((sum, item) => sum + item.sources.length, 0);
  return {
    cases: all.total,
    industries: new Set(all.items.map((item) => item.industry.slug)).size,
    scenarios: new Set(all.items.flatMap((item) => item.scenarios.map((scene) => scene.slug))).size,
    sources: sourceCount,
    mode: all.mode,
  };
}

export async function listCaseSitemapEntries(limit = 5_000) {
  if (!isMongoConfigured()) return demoCases.map(({ slug, updatedAt }) => ({ slug, updatedAt }));
  const db = await getDb();
  return db.collection<CaseStudy>("cases").find({ contentStatus: "published" }).sort({ updatedAt: -1 }).limit(limit).project<{ slug: string; updatedAt: string }>({ _id: 0, slug: 1, updatedAt: 1 }).toArray();
}

let atlasVectorSearchAvailable = true;
export async function findVectorSimilarCases(queryVector: number[], limit = 30) {
  if (!isMongoConfigured() || !atlasVectorSearchAvailable) return [] as Array<{ item: CaseStudy; score: number }>;
  const db = await getDb();
  try {
    const rows = await db.collection<CaseStudy>("cases").aggregate<CaseStudy & { vectorScore: number }>([
      { $vectorSearch: { index: "case_dedup_vector", path: "dedupVector", queryVector, numCandidates: Math.max(100, limit * 8), limit } },
      { $match: { contentStatus: { $ne: "deleted" } } },
      { $set: { vectorScore: { $meta: "vectorSearchScore" } } },
      { $project: { _id: 0 } },
    ]).toArray();
    return rows.map(({ vectorScore, ...item }) => ({ item: item as CaseStudy, score: vectorScore }));
  } catch {
    atlasVectorSearchAvailable = false;
    return [];
  }
}
