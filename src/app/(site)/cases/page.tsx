import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { CaseCard } from "@/components/case-card";
import { CaseFilters } from "@/components/case-filters";
import { DemoNotice } from "@/components/demo-notice";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { listCases } from "@/lib/repositories/cases";
import type { CaseQuery, OutcomeStatus } from "@/lib/types";

export const metadata: Metadata = { title: "AI 案例库", description: "按行业、企业规模、AI 场景和项目结果查找中国企业 AI 改造案例。" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function CasesPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query: CaseQuery = {
    q: one(raw.q), industry: one(raw.industry), scenario: one(raw.scenario), size: one(raw.size),
    outcome: one(raw.outcome) as OutcomeStatus | "all" | undefined,
    roi: one(raw.roi) as CaseQuery["roi"], sort: one(raw.sort) as CaseQuery["sort"],
    page: Number(one(raw.page)) || 1, limit: 12,
  };
  const result = await listCases(query);
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string" && key !== "page") urlParams.set(key, value);
  return <main className="container-page py-12 sm:py-16 lg:py-20">
    <div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.16em] text-primary">案例检索</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">找到可借鉴的 AI 路径</h1><p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">从真实业务问题出发，筛选与你的行业、规模和场景更接近的案例。</p></div>
    <div className="mt-8"><CaseFilters /></div>
    {result.mode === "demo" && <div className="mt-5"><DemoNotice /></div>}
    <div className="mt-10 flex items-end justify-between border-b pb-4"><div><h2 className="text-lg font-semibold">{query.q ? `“${query.q}”的搜索结果` : "全部案例"}</h2><p className="mt-1 text-xs text-muted-foreground">共 {result.total} 条，当前第 {result.page} / {result.pageCount} 页</p></div></div>
    {result.items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <CaseCard key={item.id} caseStudy={item} />)}</div> : <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed bg-muted/20 text-center"><div><SearchX className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">暂时没有匹配案例</h2><p className="mt-2 text-sm text-muted-foreground">可以减少筛选条件，或换一个更宽泛的关键词。</p><Button variant="outline" asChild className="mt-5"><Link href="/cases">查看全部案例</Link></Button></div></div>}
    <Pagination page={result.page} pageCount={result.pageCount} params={urlParams} />
  </main>;
}
