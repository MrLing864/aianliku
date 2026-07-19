import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CaseCard } from "@/components/case-card";
import { CatalogIcon } from "@/components/icon-map";
import { Button } from "@/components/ui/button";
import type { Industry, PaginatedCases, Scenario } from "@/lib/types";

export function CatalogLanding({ kind, entry, result }: { kind: "industry" | "scenario"; entry: Industry | Scenario; result: PaginatedCases }) {
  const filter = kind === "industry" ? `industry=${entry.slug}` : `scenario=${entry.slug}`;
  return <main>
    <section className="border-b bg-card/45"><div className="container-page py-16 sm:py-20"><div className="grid max-w-4xl gap-7 sm:grid-cols-[64px_1fr] sm:items-start"><span className="grid size-14 place-items-center rounded-2xl border bg-background text-primary shadow-sm"><CatalogIcon name={entry.icon} className="size-7" /></span><div><p className="text-xs font-semibold tracking-[0.16em] text-primary">{kind === "industry" ? "行业案例" : "AI 场景"}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{kind === "industry" ? (entry as Industry).displayName : entry.name}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{entry.description}</p><div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="rounded-full border bg-background px-3 py-1.5">{result.total} 个已发布案例</span>{kind === "industry" && <span>分类依据：{(entry as Industry).standardVersion}</span>}</div></div></div></div></section>
    <section className="container-page py-14 lg:py-20"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold text-primary">案例列表</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">值得进一步阅读的实践</h2></div><Button variant="outline" asChild><Link href={`/cases?${filter}`}>进入高级筛选<ArrowRight /></Link></Button></div>
      {result.items.length ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <CaseCard key={item.id} caseStudy={item} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed p-12 text-center"><p className="font-medium">案例正在整理中</p><p className="mt-2 text-sm text-muted-foreground">你可以先浏览全部案例，或联系我们提供线索。</p><Button asChild className="mt-5"><Link href="/cases">浏览全部案例</Link></Button></div>}
      {result.total < 5 && <p className="mt-8 rounded-xl bg-muted/50 p-4 text-xs leading-6 text-muted-foreground">本聚合页案例数量暂未达到公开索引门槛，因此不会被搜索引擎收录；页面仍可正常浏览。</p>}
    </section>
  </main>;
}
