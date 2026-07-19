import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { completeAssessmentDeletionTask, requestReportDeletionByToken } from "@/lib/repositories/reports";
import { deleteAssessmentDataWorkflow } from "@/workflows/assessment-report";

export async function DELETE(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (token === "demo") return NextResponse.json({ ok: true, demo: true });
  const taskId = await requestReportDeletionByToken(token);
  if (!taskId) return NextResponse.json({ error: "报告不存在或链接已经失效" }, { status: 404 });
  try {
    const run = await start(deleteAssessmentDataWorkflow, [taskId]);
    return NextResponse.json({ ok: true, accepted: true, taskId, runId: run.runId }, { status: 202 });
  } catch {
    await completeAssessmentDeletionTask(taskId);
    return NextResponse.json({ ok: true, accepted: true, taskId, completedSynchronously: true });
  }
}
