"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DuplicateCandidate } from "@/lib/types";

const actions = [
  { value: "supplement_existing", label: "补充已有案例来源" },
  { value: "distinct_project", label: "同企业不同项目" },
  { value: "independent_case", label: "独立案例" },
  { value: "defer", label: "暂缓核实" },
  { value: "invalid_record", label: "无效记录" },
] as const;

const relationshipLabels: Record<NonNullable<DuplicateCandidate["relationship"]>, string> = {
  same_project: "疑似同一项目",
  project_evolution: "疑似项目延续或升级",
  same_org_different_project: "同企业的不同项目",
  different_project: "不同项目",
  insufficient_evidence: "证据不足",
};

export function DuplicateReviewCard({ item }: { item: DuplicateCandidate }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function resolve(action: (typeof actions)[number]["value"]) {
    setLoading(action);
    setError("");
    try {
      const response = await fetch(`/api/admin/duplicates/${item.id}/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      setError((await response.json().catch(() => null))?.error ?? "处理失败");
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading("");
    }
  }

  const scoreItems = item.relationship
    ? [
        { label: "规则匹配", value: item.ruleScore ?? 0 },
        { label: "首次判断", value: item.modelScore ?? 0 },
        { label: "独立复核", value: item.verificationScore ?? 0 },
      ]
    : [
        { label: "企业", value: item.scores.organization },
        { label: "语义", value: item.scores.semantic },
        { label: "场景", value: item.scores.scenario },
        { label: "业务部门", value: item.scores.function },
        { label: "时间", value: item.scores.time },
        { label: "实施方", value: item.scores.implementer },
        { label: "效果", value: item.scores.metrics },
      ];

  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">新导入</p>
            <h2 className="mt-1 font-semibold">
              {item.incomingOrganization} · {item.incomingTitle}
            </h2>
            <p className="mt-4 text-xs text-muted-foreground">库内候选</p>
            <p className="mt-1 font-medium text-primary">{item.existingCaseTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.relationship ? (
              <Badge variant="outline">{relationshipLabels[item.relationship]}</Badge>
            ) : null}
            <Badge className="text-sm">
              综合 {(item.scores.overall * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {scoreItems.map((score) => (
            <div key={score.label} className="rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">{score.label}</span>
              <p className="mt-1 font-mono font-semibold">
                {(score.value * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>

        {Boolean(item.matchedFacts?.length || item.conflictingFacts?.length || item.missingFacts?.length) ? (
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <FactList title="相符事实" items={item.matchedFacts} />
            <FactList title="冲突事实" items={item.conflictingFacts} />
            <FactList title="缺少证据" items={item.missingFacts} />
          </div>
        ) : null}

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-5"
          placeholder="审核依据或备注（建议填写）"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.value}
              variant={action.value === "supplement_existing" ? "default" : "outline"}
              onClick={() => resolve(action.value)}
              disabled={Boolean(loading)}
            >
              {loading === action.value ? <LoaderCircle className="animate-spin" /> : null}
              {action.label}
            </Button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function FactList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-medium">{title}</p>
      {items?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-muted-foreground">无</p>
      )}
    </div>
  );
}
