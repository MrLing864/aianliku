import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/catalog-landing";
import { JsonLd } from "@/components/json-ld";
import { getIndustry } from "@/lib/catalog";
import { listCases } from "@/lib/repositories/cases";
import { breadcrumbJsonLd, buildMetadata, collectionJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  let slug = "";
  try { slug = (await params).slug; } catch { return {}; }
  const entry = getIndustry(slug);
  if (!entry) return {};
  const result = await listCases({ industry: entry.slug, limit: 1 });
  const indexed = result.total >= 5;
  return buildMetadata({
    title: `${entry.displayName} AI 改造案例`,
    description: `${entry.displayName}行业的 AI 改造案例合集：看同行如何用自动客服、自动报价、知识库等场景解决实际问题，包含投入、路径与结果。共 ${result.total} 个案例。`,
    path: `/industries/${entry.slug}`,
    noIndex: !indexed,
    og: { title: `${entry.displayName} AI 改造案例`, subtitle: `共 ${result.total} 个真实落地案例`, kind: "industry" },
  });
}
export default async function IndustryPage({ params }: { params: Params }) {
  const slug = (await params).slug;
  const entry = getIndustry(slug);
  if (!entry) notFound();
  const result = await listCases({ industry: entry.slug, limit: 18 });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "首页", url: "/" }, { name: "行业案例", url: "/cases" }, { name: entry.displayName, url: `/industries/${entry.slug}` }])} />
      <JsonLd data={collectionJsonLd({ name: `${entry.displayName} AI 改造案例`, description: entry.description, url: `/industries/${entry.slug}`, count: result.total })} />
      <CatalogLanding kind="industry" entry={entry} result={result} />
    </>
  );
}
