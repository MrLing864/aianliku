"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MergeTarget { id: string; title: string; organization: string }

export function CaseMergePanel({ sourceId, targets }: { sourceId: string; targets: MergeTarget[] }) {
  const router = useRouter();
  const [targetCaseId, setTargetCaseId] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function merge() {
    setLoading(true); setError("");
    const response = await fetch(`/api/admin/cases/${sourceId}/merge`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetCaseId, reason, password }) }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (response?.ok) { router.push(`/admin/cases/${data.targetCaseId}`); router.refresh(); return; }
    setError(data?.error ?? "合并失败，请稍后重试"); setLoading(false);
  }
  return <Card className="border-amber-200 bg-amber-50/35 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitMerge className="size-4 text-amber-700" />合并到已有主案例</CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-muted-foreground">仅在确认两条记录属于同一个项目时使用。系统会保留来源、版本和审计记录，并把旧公开地址永久跳转到主案例。</p><div className="space-y-2"><Label>主案例</Label><Select value={targetCaseId} onValueChange={setTargetCaseId}><SelectTrigger className="w-full"><SelectValue placeholder="选择已发布主案例" /></SelectTrigger><SelectContent>{targets.map((target) => <SelectItem key={target.id} value={target.id}>{target.organization} · {target.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="merge-reason">合并依据</Label><Textarea id="merge-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={1000} placeholder="说明为何确认是同一项目，以及核对过的来源" /></div><div className="space-y-2"><Label htmlFor="merge-password">管理员密码（二次确认）</Label><Input id="merge-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button variant="outline" onClick={merge} disabled={loading || !targetCaseId || reason.trim().length < 10 || password.length < 8} className="border-amber-300 bg-background text-amber-900 hover:bg-amber-100">{loading ? <LoaderCircle className="animate-spin" /> : <ShieldAlert />}确认合并并建立永久跳转</Button></CardContent></Card>;
}
