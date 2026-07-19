import { ImportWorkbench } from "@/components/import-workbench";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listImportJobs } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";
export default async function ImportsPage() {
  const jobs = await listImportJobs();
  const retryJobs = jobs.filter((job) => Number(job.counts?.invalid ?? 0) > 0).map((job) => ({ id: job.id, invalid: Number(job.counts.invalid) }));
  return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold text-primary">内容导入</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">批量导入与去重预检</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">先暂存，不直接发布。精确重复更新采集记录；疑似重复必须由管理员决定如何处理。</p><div className="mt-7"><ImportWorkbench retryJobs={retryJobs} /></div><section className="mt-10"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">最近导入任务</h2><Badge variant="secondary">{jobs.length}</Badge></div>{jobs.length ? <div className="mt-4 space-y-3">{jobs.map((job) => <Card key={job.id} className="py-0 shadow-none"><CardContent className="flex flex-wrap items-center gap-4 p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs">{job.id}</p><Badge variant="outline">{job.status}</Badge><Badge variant="secondary">{job.format.toUpperCase()} · 模板 {job.templateVersion}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.createdAt))} · 共 {job.total} 行</p></div><div className="flex flex-wrap gap-2">{Object.entries(job.counts ?? {}).map(([status, count]) => <Badge key={status} variant="outline">{status} {count}</Badge>)}</div></CardContent></Card>)}</div> : <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">暂无已持久化导入任务</p>}</section></div>;
}
