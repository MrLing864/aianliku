import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays } from "lucide-react";
import { OutcomeBadge, ConfidenceBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CaseStudy } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaseCard({ caseStudy, featured = false }: { caseStudy: CaseStudy; featured?: boolean }) {
  return (
    <Card className={cn("group relative overflow-hidden border-border/75 bg-card/80 py-0 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_50px_-32px_rgba(15,75,65,0.32)]", featured && "lg:min-h-[300px]") }>
      <Link href={`/cases/${caseStudy.slug}`} className="absolute inset-0 z-10 rounded-xl focus-ring" aria-label={`查看案例：${caseStudy.title}`} />
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><OutcomeBadge status={caseStudy.outcomeStatus} /><ConfidenceBadge level={caseStudy.confidence} />{caseStudy.demo && <Badge variant="secondary">演示</Badge>}</div>
        <div className="mt-5 flex-1"><p className="mb-2 text-xs font-medium text-primary">{caseStudy.industry.displayName} · {caseStudy.scenarios[0]?.name}</p><h3 className={cn("text-balance font-semibold leading-snug tracking-[-0.025em] transition-colors group-hover:text-primary", featured ? "text-xl sm:text-2xl" : "text-lg")}>{caseStudy.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{caseStudy.summary}</p></div>
        <div className="mt-6 flex items-end justify-between gap-4 border-t pt-4"><div className="space-y-1.5 text-xs text-muted-foreground"><p className="flex items-center gap-1.5"><Building2 className="size-3.5" />{caseStudy.organization.name} · {caseStudy.organization.size}</p><p className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />更新于 {new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short" }).format(new Date(caseStudy.updatedAt))}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-full border bg-background transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight className="size-4" /></span></div>
      </CardContent>
    </Card>
  );
}
