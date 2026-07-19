import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  return (
    <form action="/cases" className="relative mx-auto mt-8 max-w-2xl" role="search">
      <div className="flex items-center rounded-2xl border border-border/90 bg-card p-2 shadow-[0_18px_70px_-34px_rgba(18,55,50,0.35)] transition-shadow focus-within:border-primary/45 focus-within:shadow-[0_22px_80px_-34px_rgba(18,90,75,0.42)]">
        <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
        <Input name="q" aria-label="搜索 AI 案例" className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0" placeholder="搜索行业、企业或业务问题，例如：报价、客服、OCR" />
        <Button type="submit" size="lg" className="hidden rounded-xl px-6 sm:inline-flex">搜索案例</Button>
        <Button type="submit" size="icon-lg" className="rounded-xl sm:hidden" aria-label="提交搜索"><Search /></Button>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" />支持行业、企业规模、AI 场景与业务问题组合检索</p>
    </form>
  );
}
