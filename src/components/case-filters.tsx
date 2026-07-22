"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industries, scenarios, sizeBands } from "@/lib/catalog";

const outcomeOptions = [
  ["all", "全部结果"], ["success", "成功"], ["partial", "部分达成"], ["failure", "失败复盘"], ["undisclosed", "结果未披露"],
] as const;

const implementationYears = [2023, 2024, 2025, 2026] as const;

export function CaseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const activeCount = useMemo(() => ["q", "industry", "scenario", "size", "outcome", "roi", "implementationYear"].filter((key) => {
    const value = searchParams.get(key);
    return value && value !== "all";
  }).length, [searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key); else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update("q", keyword.trim());
  }

  function reset() {
    setKeyword("");
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-[0_18px_60px_-48px_rgba(20,40,36,.38)] sm:p-5">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="h-11 pl-10" placeholder="搜索企业、问题、方案或场景" aria-label="搜索案例" /></div>
        <Button type="submit" size="lg" className="h-11 px-5">搜索</Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><SlidersHorizontal className="size-3.5" />筛选</span>
        <Select value={searchParams.get("industry") ?? "all"} onValueChange={(value) => update("industry", value)}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="行业" /></SelectTrigger><SelectContent><SelectItem value="all">全部行业</SelectItem>{industries.map((item) => <SelectItem key={item.id} value={item.slug}>{item.displayName}</SelectItem>)}</SelectContent></Select>
        <Select value={searchParams.get("scenario") ?? "all"} onValueChange={(value) => update("scenario", value)}><SelectTrigger className="h-9 min-w-36"><SelectValue placeholder="AI 场景" /></SelectTrigger><SelectContent><SelectItem value="all">全部场景</SelectItem>{scenarios.map((item) => <SelectItem key={item.id} value={item.slug}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={searchParams.get("size") ?? "all"} onValueChange={(value) => update("size", value)}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="企业规模" /></SelectTrigger><SelectContent><SelectItem value="all">全部规模</SelectItem>{sizeBands.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={searchParams.get("outcome") ?? "all"} onValueChange={(value) => update("outcome", value)}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="项目结果" /></SelectTrigger><SelectContent>{outcomeOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={searchParams.get("implementationYear") ?? "all"} onValueChange={(value) => update("implementationYear", value)}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="实施年份" /></SelectTrigger><SelectContent><SelectItem value="all">全部年份</SelectItem>{implementationYears.map((year) => <SelectItem key={year} value={String(year)}>{year} 年</SelectItem>)}</SelectContent></Select>
        <Select value={searchParams.get("sort") ?? "relevance"} onValueChange={(value) => update("sort", value)}><SelectTrigger className="h-9 min-w-28"><SelectValue placeholder="排序" /></SelectTrigger><SelectContent><SelectItem value="relevance">综合排序</SelectItem><SelectItem value="latest">最近更新</SelectItem><SelectItem value="popular">最多阅读</SelectItem></SelectContent></Select>
        {activeCount > 0 && <Button type="button" variant="ghost" size="sm" onClick={reset}><RotateCcw />清除 {activeCount} 项</Button>}
      </div>
    </div>
  );
}
