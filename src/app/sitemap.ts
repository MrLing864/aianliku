import type { MetadataRoute } from "next";
import { industries, scenarios } from "@/lib/catalog";
import { env } from "@/lib/env";
import { listCases, listCaseSitemapEntries } from "@/lib/repositories/cases";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const staticPages = ["", "/cases", "/about", "/contact", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/cases" ? "daily" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  let casePages: MetadataRoute.Sitemap = [];
  let catalogs: MetadataRoute.Sitemap = [];
  try {
    const cases = await listCaseSitemapEntries();
    casePages = cases.map((item) => ({
      url: `${base}/cases/${item.slug}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
    const eligibleIndustries = await Promise.all(
      industries.map(async (entry) => ({ entry, total: (await listCases({ industry: entry.slug, limit: 1 })).total })),
    );
    const eligibleScenarios = await Promise.all(
      scenarios.map(async (entry) => ({ entry, total: (await listCases({ scenario: entry.slug, limit: 1 })).total })),
    );
    catalogs = [
      ...eligibleIndustries.filter((item) => item.total >= 5).map((item) => `/industries/${item.entry.slug}`),
      ...eligibleScenarios.filter((item) => item.total >= 5).map((item) => `/scenarios/${item.entry.slug}`),
    ].map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch (err) {
    console.warn("Sitemap: skipped database-backed entries because the database is unavailable:", err instanceof Error ? err.message : err);
  }
  return [...staticPages, ...casePages, ...catalogs];
}
