import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/catalog-landing";
import { getIndustry } from "@/lib/catalog";
import { listCases } from "@/lib/repositories/cases";

type Params = Promise<{ slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> { const entry = getIndustry((await params).slug); if (!entry) return {}; const result = await listCases({ industry: entry.slug, limit: 1 }); return { title: `${entry.displayName} AI 案例`, description: entry.description, robots: { index: result.total >= 5, follow: true }, alternates: { canonical: `/industries/${entry.slug}` } }; }
export default async function IndustryPage({ params }: { params: Params }) { const entry = getIndustry((await params).slug); if (!entry) notFound(); const result = await listCases({ industry: entry.slug, limit: 18 }); return <CatalogLanding kind="industry" entry={entry} result={result} />; }
