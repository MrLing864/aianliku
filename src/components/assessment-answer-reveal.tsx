"use client";

import { useState } from "react";
import { Eye, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const labels: Record<string, string> = {
  industry: "行业",
  size: "企业规模",
  business: "主营业务",
  repeatedWork: "重复工作",
  systems: "现有系统",
  volume: "业务量",
  laborCost: "人工成本",
  budget: "预算",
  urgency: "紧迫度",
  goal: "改造目标",
  followUp: "动态追问补充",
};

export function AssessmentAnswerReveal({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);

  async function reveal() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/assessments/${jobId}/reveal`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (response?.ok) { setAnswers(data.answers); setPassword(""); }
    else setError(data?.error ?? "查看失败，请稍后重试");
    setLoading(false);
  }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setPassword(""); setAnswers(null); setError(""); } }}>
    <DialogTrigger asChild><Button size="sm" variant="outline"><Eye />查看问答</Button></DialogTrigger>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>高敏信息访问</DialogTitle><DialogDescription>原始问答可能包含企业内部信息。访问需要再次验证管理员密码，并写入审计日志。</DialogDescription></DialogHeader>
      {answers ? <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">{Object.entries(answers).map(([key, value]) => <div key={key} className="rounded-xl border bg-muted/30 p-4"><p className="text-xs font-medium text-muted-foreground">{labels[key] ?? key}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{Array.isArray(value) ? value.join("、") : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "未填写")}</p></div>)}</div> : <div className="space-y-2"><Label htmlFor={`reveal-password-${jobId}`}>管理员密码</Label><Input id={`reveal-password-${jobId}`} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && password.length >= 8) void reveal(); }} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>}
      <DialogFooter>{answers ? <Button variant="outline" onClick={() => setOpen(false)}>关闭</Button> : <Button onClick={reveal} disabled={loading || password.length < 8}>{loading ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}验证并查看</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>;
}
