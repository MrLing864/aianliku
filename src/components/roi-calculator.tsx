"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RoiCalculator({ token, initialVersionCount = 0 }: { token: string; initialVersionCount?: number }) {
  const [investment, setInvestment] = useState(100000);
  const [monthlyCost, setMonthlyCost] = useState(5000);
  const [monthlySaving, setMonthlySaving] = useState(20000);
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState<number | null>(initialVersionCount || null);
  const [error, setError] = useState("");
  const result = useMemo(() => {
    const net = monthlySaving - monthlyCost;
    return net > 0 && investment >= 0 ? investment / net : null;
  }, [investment, monthlyCost, monthlySaving]);

  async function saveVersion() {
    setSaving(true); setError("");
    const response = await fetch(`/api/v1/reports/${encodeURIComponent(token)}/roi`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ investment, monthlyCost, monthlySaving }) }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (response?.ok) setSavedVersion(data?.version?.version ?? initialVersionCount + 1); else setError(data?.error ?? "保存失败，请稍后重试。");
    setSaving(false);
  }

  return <Card className="mt-4 border-dashed shadow-none"><CardContent className="p-6">
    <div className="flex items-center gap-2"><Calculator className="size-4 text-primary" /><h3 className="text-sm font-semibold">用你的变量重新计算</h3></div>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">这里仅做简单现金回收期演算，不会覆盖报告原始假设。</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      <div className="space-y-2"><Label htmlFor="roi-investment">一次性投入（元）</Label><Input id="roi-investment" type="number" min={0} value={investment} onChange={(event) => setInvestment(Number(event.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="roi-cost">月运行成本（元）</Label><Input id="roi-cost" type="number" min={0} value={monthlyCost} onChange={(event) => setMonthlyCost(Number(event.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="roi-saving">月度节省（元）</Label><Input id="roi-saving" type="number" min={0} value={monthlySaving} onChange={(event) => setMonthlySaving(Number(event.target.value))} /></div>
    </div>
    <div className="mt-5 rounded-xl bg-primary/[0.055] p-4"><p className="text-xs text-muted-foreground">简单回收期</p><p className="mt-1 text-xl font-semibold">{result === null ? "无法计算（净节省需大于 0）" : `约 ${result.toFixed(1)} 个月`}</p><p className="mt-2 text-[11px] text-muted-foreground">公式：一次性投入 ÷（月度节省 − 月运行成本），未计资金成本、税费和间接改造成本。</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div>{savedVersion && <p className="flex items-center gap-1.5 text-xs text-primary"><CheckCircle2 className="size-3.5" />已保存为假设版本 {savedVersion}，原报告假设保持不变</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div><Button type="button" variant="outline" size="sm" onClick={saveVersion} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}保存这组假设</Button></div>
  </CardContent></Card>;
}
