import { BrainCircuit, CheckCircle2, Clock3 } from "lucide-react";
import { AssessmentAnswerReveal } from "@/components/assessment-answer-reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAssessmentJobs } from "@/lib/repositories/admin";
import type { AssessmentJobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const jobStatus: Record<AssessmentJobStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "排队中", variant: "secondary" },
  processing: { label: "推理中", variant: "default" },
  ready: { label: "已完成", variant: "outline" },
  failed: { label: "生成失败", variant: "destructive" },
  deleted: { label: "已删除", variant: "secondary" },
};

export default async function AssessmentsPage() {
  const items = await listAssessmentJobs();
  const processing = items.filter((item) => item.status === "queued" || item.status === "processing").length;
  const ready = items.filter((item) => item.status === "ready").length;

  return (
    <div>
      <p className="text-xs font-semibold text-primary">AI 体检运营</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">报告任务</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        查看异步推理状态。
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {[
          { label: "生成中", value: processing, icon: Clock3 },
          { label: "已完成", value: ready, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length ? (
        <Card className="mt-6 shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">提交时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>报告</TableHead>
                  <TableHead className="pr-5 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-5">
                      <p>{formatDate(item.createdAt)}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.id}</p>
                    </TableCell>
                    <TableCell>{item.phoneMasked}</TableCell>
                    <TableCell>
                      <Badge variant={jobStatus[item.status].variant}>{jobStatus[item.status].label}</Badge>
                      {item.errorCode && <p className="mt-1 text-[11px] text-destructive">{item.errorCode}</p>}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-2"><AssessmentAnswerReveal jobId={item.id} /></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed text-center">
          <div><BrainCircuit className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">暂无体检任务</h2><p className="mt-2 text-sm text-muted-foreground">用户提交手机号后，异步生成任务会出现在这里。</p></div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
