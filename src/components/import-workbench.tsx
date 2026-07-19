"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, ShieldAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Result = { row: number; title?: string; status: string; score?: number; message?: string; error?: string; candidate?: { title: string; organization: string } };
const example = JSON.stringify([{ title: "某制造企业使用 OCR 自动录入订单", organization: "某制造企业", sourceUrl: "https://example.com/case-1?utm_source=demo", sourceTitle: "企业数字化案例", sourceType: "company", publisher: "某制造企业", externalId: "case-2026-001", publishedAt: "2026-06-01", scenario: "OCR", department: "销售", solution: "识别订单并写入 ERP", result: "录入时间降低 60%", rawText: "来源材料全文可放在这里" }], null, 2);

export function ImportWorkbench({ retryJobs = [] }: { retryJobs?: Array<{ id: string; invalid: number }> }) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [content, setContent] = useState(example);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [persisted, setPersisted] = useState(true);
  const [retryJobId, setRetryJobId] = useState("new");

  async function run() {
    setLoading(true);
    setError("");
    const form = file ? new FormData() : null;
    if (form && file) { form.set("file", file); if (retryJobId !== "new") form.set("retryJobId", retryJobId); }
    const response = await fetch("/api/admin/imports", form ? { method: "POST", body: form } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format, content, retryJobId: retryJobId === "new" ? undefined : retryJobId }) }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (!response?.ok) setError(data?.error ?? "预检失败");
    else { setResults(data.results); setPersisted(data.persisted); }
    setLoading(false);
  }

  function downloadErrors() {
    const failed = results.filter((item) => item.status === "invalid" || item.error);
    const csv = ["original_row_number,title,status,error", ...failed.map((item) => [item.row, item.title ?? "", item.status, item.error ?? item.message ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aianliku-import-errors.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const hasErrors = results.some((item) => item.status === "invalid" || item.error);
  return <div><Card className="shadow-none"><CardContent className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">上传文件或粘贴批量数据</h2><p className="mt-1 text-xs text-muted-foreground">支持 UTF-8 CSV、XLSX、JSON；单次最多 1,000 条、20 MB。</p></div><div className="flex flex-wrap gap-2"><Select value={retryJobId} onValueChange={setRetryJobId}><SelectTrigger className="min-w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">创建新导入任务</SelectItem>{retryJobs.map((job) => <SelectItem key={job.id} value={job.id}>重试 {job.id} · {job.invalid} 行</SelectItem>)}</SelectContent></Select><Select value={format} onValueChange={(value) => setFormat(value as "json" | "csv")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="json">粘贴 JSON</SelectItem><SelectItem value="csv">粘贴 CSV</SelectItem></SelectContent></Select></div></div>{retryJobId !== "new" && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">当前结果会写回原任务。请保留错误报告中的 original_row_number，成功行不会再次创建。</p>}<div className="mt-5 rounded-xl border border-dashed bg-muted/25 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border bg-background text-primary"><FileSpreadsheet className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">选择标准模板文件</p><p className="mt-1 text-xs text-muted-foreground">选择文件后将优先使用文件内容。</p></div></div><Input type="file" accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-4" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />{file && <p className="mt-2 text-xs text-primary">已选择：{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}</div><Textarea value={content} onChange={(event) => { setContent(event.target.value); if (file) setFile(null); }} className="mt-5 min-h-72 font-mono text-xs" spellCheck={false} /><div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-muted-foreground">必填：title、organization。推荐包含 sourceUrl、publisher、externalId、scenario、department、solution、result、rawText。</p><Button onClick={run} disabled={loading || (!file && !content.trim())}>{loading ? <LoaderCircle className="animate-spin" /> : <Upload />}开始去重预检</Button></div>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}</CardContent></Card>{results.length > 0 && <div className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">预检结果</h2>{!persisted && <Badge variant="secondary">演示预检 · 未写入数据库</Badge>}</div>{hasErrors && <Button variant="outline" size="sm" onClick={downloadErrors}><Download />下载错误报告</Button>}</div><div className="mt-4 space-y-3">{results.map((item) => { const high = item.status === "blocked_duplicate" || item.status === "exact_duplicate"; const medium = item.status === "needs_duplicate_review"; const Icon = high ? ShieldAlert : medium ? AlertTriangle : item.status === "invalid" ? AlertTriangle : CheckCircle2; return <Card key={item.row} className="py-0 shadow-none"><CardContent className="flex gap-4 p-4"><Icon className={`mt-0.5 size-5 shrink-0 ${high ? "text-rose-600" : medium ? "text-amber-600" : "text-primary"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">第 {item.row} 行 · {item.title ?? "格式错误"}</p><Badge variant="outline">{item.status}</Badge>{typeof item.score === "number" && <Badge variant="secondary">相似度 {(item.score * 100).toFixed(1)}%</Badge>}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.message || item.error || (item.candidate ? `最相似：${item.candidate.organization} / ${item.candidate.title}` : "未发现高相似案例，可进入暂存区")}</p></div></CardContent></Card>; })}</div></div>}</div>;
}
