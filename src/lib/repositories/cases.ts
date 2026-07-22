import "server-only";

import { cache } from "react";
type MongoFilter = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;
import { demoCases } from "@/data/demo-cases";
import { scenarios } from "@/lib/catalog";
import { getDb, isDbConfigured, getCloudBaseDb } from "@/lib/db/cloudbase";
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

async function searchCasesWithAtlas(): Promise<PaginatedCases | null> {
  // CloudBase 文档数据库不支持 Atlas Search，始终返回 null，由 listCases 走下方跨字段正则降级
  return null;
}

function matchesDemo(item: CaseStudy, query: CaseQuery) {
  const needle = query.q ? normalizeText(query.q) : "";
  const haystack = normalizeText([
    item.title,
    item.organization.name,
    item.summary,
    item.highlight ?? "",
    item.problem,
    item.solution,
    item.industry.displayName,
    ...item.scenarios.flatMap((scene) => [scene.name, ...scene.synonyms]),
    ...(item.painPointTags ?? []),
    ...item.implementers.map((impl) => impl.name),
    ...(item.modelStack ?? []),
    ...(item.techPath ?? []),
  ].join(" "));

  return (
    (!needle || haystack.includes(needle) || needle.split(" ").every((part) => haystack.includes(part))) &&
    (!query.industry || item.industry.slug === query.industry) &&
    (!query.scenario || item.scenarios.some((scene) => scene.slug === query.scenario)) &&
    (!query.size || item.organization.size === query.size) &&
    (!query.outcome || query.outcome === "all" || item.outcomeStatus === query.outcome) &&
    (!query.roi || query.roi === "all" || (query.roi === "disclosed" ? !item.roi.includes("未披露") : item.roi.includes("未披露"))) &&
    (!query.painPoint || (item.painPointTags ?? []).includes(query.painPoint)) &&
    (!query.implementer || item.implementers.some((impl) => normalizeText(impl.name).includes(normalizeText(query.implementer!)))) &&
    (!query.model || (item.modelStack ?? []).some((model) => normalizeText(model).includes(normalizeText(query.model!))))
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

  if (!isDbConfigured()) {
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
  const filter: MongoFilter = { contentStatus: "published" };
  if (query.industry) filter["industry.slug"] = query.industry;
  if (query.scenario) filter["scenarios.slug"] = query.scenario;
  if (query.size) filter["organization.size"] = query.size;
  if (query.outcome && query.outcome !== "all") filter.outcomeStatus = query.outcome;
  if (query.roi === "disclosed") filter.roi = { $not: /未披露/ };
  if (query.roi === "undisclosed") filter.roi = /未披露/;
  if (query.painPoint) filter.painPointTags = query.painPoint;
  if (query.implementer) filter["implementers.name"] = { $regex: escapeRegex(query.implementer), $options: "i" };
  if (query.model) filter.modelStack = { $regex: escapeRegex(query.model), $options: "i" };

  const collection = db.collection("cases");
  const atlasResult = await searchCasesWithAtlas();
  if (atlasResult) return atlasResult;

  if (query.q) {
    const terms = expandSearchTerms(query.q);
    const fields = ["title", "organization.name", "summary", "problem", "solution", "scenarios.name", "scenarios.slug", "scenarios.synonyms", "highlight", "painPointTags", "implementers.name", "modelStack", "techPath"] as const;
    filter.$or = terms.flatMap((term) => fields.map((field) => ({ [field]: { $regex: escapeRegex(term), $options: "i" } }))) as MongoFilter[];
  }

  const sort: MongoSort = query.sort === "popular" ? { views: -1 } : query.sort === "latest" ? { publishedAt: -1 } : { featured: -1, views: -1, publishedAt: -1 };
  const [items, total] = await Promise.all([
    collection.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize).project<CaseStudy>({ _id: 0, dedupVector: 0 }).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), mode: "mongodb" };
}

export const getCaseBySlug = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (!isDbConfigured()) return demoCases.find((item) => item.slug === slug) ?? null;
  const db = await getDb();
  return db.collection("cases").findOne({ slug, contentStatus: "published" }, { projection: { _id: 0, dedupVector: 0 } });
});

export type CaseRouteResolution =
  | { kind: "published"; item: CaseStudy }
  | { kind: "archived"; item: CaseStudy }
  | { kind: "redirect"; targetSlug: string }
  | { kind: "missing" };

export const resolveCaseRoute = cache(async (slug: string): Promise<CaseRouteResolution> => {
  if (!isDbConfigured()) {
    const item = demoCases.find((entry) => entry.slug === slug);
    return item ? { kind: "published", item } : { kind: "missing" };
  }
  try {
    const db = await getDb();
    const item = await db.collection("cases").findOne(
      { slug, contentStatus: { $in: ["published", "archived", "merged"] } },
      { projection: { _id: 0, dedupVector: 0 } },
    );
    if (item?.contentStatus === "published") return { kind: "published", item };
    if (item?.contentStatus === "archived") return { kind: "archived", item };
    if (item?.contentStatus === "merged" && item.mergedIntoSlug) return { kind: "redirect", targetSlug: item.mergedIntoSlug };
    const redirect = await db.collection("case_redirects").findOne({ fromSlug: slug }, { projection: { _id: 0, targetSlug: 1 } });
    return redirect?.targetSlug ? { kind: "redirect", targetSlug: redirect.targetSlug } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
});

export async function getFeaturedCases(limit = 6) {
  return (await listCases({ sort: "popular", limit })).items;
}

export async function getRelatedCases(caseStudy: CaseStudy, limit = 3) {
  const result = await listCases({ industry: caseStudy.industry?.slug, scenario: caseStudy.scenarios?.[0]?.slug, sort: "popular", limit: limit + 1 });
  return result.items.filter((item) => item.id !== caseStudy.id).slice(0, limit);
}

export async function getPublicStats() {
  if (!isDbConfigured()) {
    return { cases: 0, industries: 0, scenarios: 0, sources: 0, mode: "demo" as const };
  }
  try {
    const db = await getCloudBaseDb();
    const coll = db.collection("cases");
    const [casesRes, indAgg, scnAgg, srcAgg] = await Promise.all([
      coll.where({ contentStatus: "published" }).count(),
      coll.aggregate().match({ contentStatus: "published" }).group({ _id: "$industry.slug" }).end(),
      coll.aggregate().match({ contentStatus: "published" }).group({ _id: "$scenarios.slug" }).end(),
      coll
        .aggregate()
        .match({ contentStatus: "published" })
        .group({ _id: null, total: { $sum: { $size: "$sources" } } })
        .end(),
    ]);
    return {
      cases: casesRes?.total ?? 0,
      industries: indAgg?.data?.length ?? 0,
      scenarios: scnAgg?.data?.length ?? 0,
      sources: srcAgg?.data?.[0]?.total ?? 0,
      mode: "live" as const,
    };
  } catch (error) {
    console.error("getPublicStats failed:", error);
    return { cases: 0, industries: 0, scenarios: 0, sources: 0, mode: "demo" as const };
  }
}

export async function listCaseSitemapEntries(limit = 5_000) {
  if (!isDbConfigured()) return demoCases.map(({ slug, updatedAt }) => ({ slug, updatedAt }));
  const db = await getDb();
  return db.collection("cases").find({ contentStatus: "published" }).sort({ updatedAt: -1 }).limit(limit).project<{ slug: string; updatedAt: string }>({ _id: 0, slug: 1, updatedAt: 1 }).toArray();
}

export async function findVectorSimilarCases(_queryVector: number[], _limit = 30): Promise<Array<{ item: CaseStudy; score: number }>> {
  // CloudBase 文档数据库暂不支持向量检索，由调用方降级到“同行业/同场景”推荐
  return [];
}
