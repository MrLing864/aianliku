import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, SearchX, Sparkles } from "lucide-react";
import { CaseCard } from "@/components/case-card";
import { CaseFilters } from "@/components/case-filters";
import { DemoNotice } from "@/components/demo-notice";
import { Pagination } from "@/components/pagination";
import { SearchEventTracker } from "@/components/search-event-tracker";
import { Button } from "@/components/ui/button";
import { listCases } from "@/lib/repositories/cases";
import type { CaseQuery, OutcomeStatus } from "@/lib/types";
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  let raw: Record<string, string | string[] | undefined> = {};
  try {
    const resolved = await searchParams;
    if (resolved && typeof resolved === "object") raw = resolved as Record<string, string | string[] | undefined>;
  } catch {
    raw = {};
  }
  const hasQuery = Object.values(raw).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
  const keyword = one(raw.q)?.trim();
  return {
    title: keyword ? `“${keyword.slice(0, 60)}”相关 AI 案例` : "AI 案例库",
    description:
      "按行业、企业规模、AI 场景和项目结果查找中国企业 AI 改造案例。",
    alternates: { canonical: "/cases" },
    robots: hasQuery
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let raw: Record<string, string | string[] | undefined> = {};
  try {
    const resolved = await searchParams;
    if (resolved && typeof resolved === "object") raw = resolved as Record<string, string | string[] | undefined>;
  } catch {
    raw = {};
  }
  const query: CaseQuery = {
    q: one(raw.q),
    industry: one(raw.industry),
    scenario: one(raw.scenario),
    size: one(raw.size),
    outcome: one(raw.outcome) as OutcomeStatus | "all" | undefined,
    roi: one(raw.roi) as CaseQuery["roi"],
    sort: one(raw.sort) as CaseQuery["sort"],
    page: Number(one(raw.page)) || 1,
    limit: 12,
    implementationYear: one(raw.implementationYear) ? Number(one(raw.implementationYear)) : undefined,
    valueTier: one(raw.valueTier) as CaseQuery["valueTier"],
  };
  const result = await listCases(query);
  const fallbackCases =
    result.items.length === 0
      ? (await listCases({ page: 1, limit: 3, sort: "popular" })).items
      : [];
  const hasActiveSearch = Boolean(
    query.q ||
    query.industry ||
    query.scenario ||
    query.size ||
    query.implementationYear ||
    query.valueTier ||
    (query.outcome && query.outcome !== "all") ||
    (query.roi && query.roi !== "all"),
  );
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(raw))
    if (typeof value === "string" && key !== "page") urlParams.set(key, value);
  return (
    <main className="container-page py-12 sm:py-16 lg:py-20">
      <SearchEventTracker
        active={hasActiveSearch}
        zeroResults={hasActiveSearch && result.total === 0}
      />
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          案例检索
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          找到可借鉴的 AI 路径
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          从真实业务问题出发，筛选与你的行业、规模和场景更接近的案例。
        </p>
      </div>
      <div className="mt-8">
        <CaseFilters />
      </div>
      {result.mode === "demo" && (
        <div className="mt-5">
          <DemoNotice />
        </div>
      )}
      <div className="mt-10 flex items-end justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {query.q ? `“${query.q}”的搜索结果` : "全部案例"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            共 {result.total} 条，当前第 {result.page} / {result.pageCount} 页
          </p>
        </div>
      </div>
      {result.items.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item) => (
            <CaseCard key={item.id} caseStudy={item} />
          ))}
        </div>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border bg-muted/20">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-background text-muted-foreground">
                <SearchX className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">暂时没有完全匹配的案例</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  我们没有把不相关案例硬塞进结果。可以清除筛选继续浏览，或通过企业
                  AI 体检从业务问题反推适合的改造方向。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/cases">清除全部条件</Link>
              </Button>
              <Button asChild>
                <Link href="/assessment">
                  <Sparkles />
                  开始免费体检
                </Link>
              </Button>
            </div>
          </div>
          {fallbackCases.length > 0 && (
            <div className="border-t bg-background/75 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-primary">继续探索</p>
                  <h3 className="mt-1 text-lg font-semibold">
                    大家正在看的案例
                  </h3>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cases">
                    全部案例
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {fallbackCases.map((item) => (
                  <CaseCard key={item.id} caseStudy={item} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        params={urlParams}
      />
    </main>
  );
}
