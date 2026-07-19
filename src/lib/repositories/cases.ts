import "server-only";

import { cache } from "react";
import type { Filter, Sort } from "mongodb";
import { demoCases } from "@/data/demo-cases";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { CaseQuery, CaseStudy, PaginatedCases } from "@/lib/types";

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN").replace(/[\s，。！？、：；,.!?:;（）()【】\[\]]+/g, " ");
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

  if (query.q) {
    const q = query.q.slice(0, 100);
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { "organization.name": { $regex: q, $options: "i" } },
      { summary: { $regex: q, $options: "i" } },
      { problem: { $regex: q, $options: "i" } },
      { solution: { $regex: q, $options: "i" } },
      { "scenarios.name": { $regex: q, $options: "i" } },
      { "scenarios.synonyms": { $regex: q, $options: "i" } },
    ];
  }

  const sort: Sort = query.sort === "popular" ? { views: -1 } : query.sort === "latest" ? { publishedAt: -1 } : { featured: -1, views: -1, publishedAt: -1 };
  const collection = db.collection<CaseStudy>("cases");
  const [items, total] = await Promise.all([
    collection.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize).project<CaseStudy>({ _id: 0 }).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), mode: "mongodb" };
}

export const getCaseBySlug = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (!isMongoConfigured()) return demoCases.find((item) => item.slug === slug) ?? null;
  const db = await getDb();
  return db.collection<CaseStudy>("cases").findOne({ slug, contentStatus: "published" }, { projection: { _id: 0 } });
});

export async function getFeaturedCases(limit = 6) {
  return (await listCases({ sort: "popular", limit })).items;
}

export async function getRelatedCases(caseStudy: CaseStudy, limit = 3) {
  const result = await listCases({ industry: caseStudy.industry.slug, scenario: caseStudy.scenarios[0]?.slug, sort: "popular", limit: limit + 1 });
  return result.items.filter((item) => item.id !== caseStudy.id).slice(0, limit);
}

export async function getPublicStats() {
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
