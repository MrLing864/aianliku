import { Badge } from "@/components/ui/badge";
import type { ConfidenceLevel, OutcomeStatus, ValueTier } from "@/lib/types";
import { VALUE_TIER_LABELS } from "@/lib/value-tier";
import { cn } from "@/lib/utils";

const outcomeMap: Record<OutcomeStatus, { label: string; className: string }> = {
  success: { label: "成功", className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
  partial: { label: "部分达成", className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" },
  failure: { label: "失败复盘", className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" },
  undisclosed: { label: "结果未披露", className: "border-border bg-muted text-muted-foreground" },
};
const confidenceMap: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: "可信度高", className: "text-emerald-700 dark:text-emerald-300" },
  medium: { label: "可信度中", className: "text-blue-700 dark:text-blue-300" },
  pending: { label: "待核验", className: "text-amber-700 dark:text-amber-300" },
};

export function OutcomeBadge({ status }: { status: OutcomeStatus }) {
  const item = outcomeMap[status] ?? outcomeMap.undisclosed;
  return <Badge variant="outline" className={cn("font-medium", item.className)}>{item.label}</Badge>;
}
export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const item = confidenceMap[level] ?? confidenceMap.pending;
  return <Badge variant="outline" className={cn("bg-background/50 font-medium", item.className)}>{item.label}</Badge>;
}

const valueTierMap: Record<ValueTier, { className: string }> = {
  extreme: { className: "border-amber-300 bg-amber-100 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-100" },
  high: { className: "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100" },
  medium: { className: "border-sky-300 bg-sky-100 text-sky-800 shadow-sm dark:border-sky-800 dark:bg-sky-900/50 dark:text-sky-100" },
  low: { className: "border-border bg-muted text-muted-foreground" },
};

export function ValueTierBadge({ tier }: { tier?: ValueTier }) {
  if (!tier || !valueTierMap[tier]) return null;
  return (
    <Badge variant="outline" className={cn("font-semibold", valueTierMap[tier].className)}>
      {VALUE_TIER_LABELS[tier]}
    </Badge>
  );
}
