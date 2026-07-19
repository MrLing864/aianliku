import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/catalog-landing";
import { getScenario } from "@/lib/catalog";
import { listCases } from "@/lib/repositories/cases";

type Params = Promise<{ slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> { const entry = getScenario((await params).slug); if (!entry) return {}; const result = await listCases({ scenario: entry.slug, limit: 1 }); return { title: `${entry.name}企业案例`, description: entry.description, robots: { index: result.total >= 5, follow: true }, alternates: { canonical: `/scenarios/${entry.slug}` } }; }
export default async function ScenarioPage({ params }: { params: Params }) { const entry = getScenario((await params).slug); if (!entry) notFound(); const result = await listCases({ scenario: entry.slug, limit: 18 }); return <CatalogLanding kind="scenario" entry={entry} result={result} />; }
