import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/catalog-landing";
import { JsonLd } from "@/components/json-ld";
import { getScenario } from "@/lib/catalog";
import { listCases } from "@/lib/repositories/cases";
import { breadcrumbJsonLd, buildMetadata, collectionJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const entry = getScenario((await params).slug);
  if (!entry) return {};
  const result = await listCases({ scenario: entry.slug, limit: 1 });
  const indexed = result.total >= 5;
  return buildMetadata({
    title: `${entry.name}企业案例`,
    description: `“${entry.name}”场景的企业 AI 改造案例合集：看不同行业如何落地该场景，包含实施路径、投入与可量化结果。共 ${result.total} 个案例。`,
    path: `/scenarios/${entry.slug}`,
    noIndex: !indexed,
    og: { title: `${entry.name}企业案例`, subtitle: `共 ${result.total} 个真实落地案例`, kind: "scenario" },
  });
}
export default async function ScenarioPage({ params }: { params: Params }) {
  const entry = getScenario((await params).slug);
  if (!entry) notFound();
  const result = await listCases({ scenario: entry.slug, limit: 18 });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "首页", url: "/" }, { name: "场景案例", url: "/cases" }, { name: entry.name, url: `/scenarios/${entry.slug}` }])} />
      <JsonLd data={collectionJsonLd({ name: `${entry.name}企业案例`, description: entry.description, url: `/scenarios/${entry.slug}`, count: result.total })} />
      <CatalogLanding kind="scenario" entry={entry} result={result} />
    </>
  );
}
