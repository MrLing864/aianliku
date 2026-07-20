import { NextResponse } from "next/server";
import { start } from "workflow/api";
import {
  completeAssessmentDeletionTask,
  requestReportDeletionByToken,
} from "@/lib/repositories/reports";
import { recordServerEvent } from "@/lib/server-analytics";
import { sendOperationalAlert } from "@/lib/operational-alerts";
import { deleteAssessmentDataWorkflow } from "@/workflows/assessment-report";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const token = (await params).token;
  if (token === "demo") return NextResponse.json({ ok: true, demo: true });
  const taskId = await requestReportDeletionByToken(token);
  if (!taskId)
    return NextResponse.json(
      { error: "报告不存在或链接已经失效" },
      { status: 404 },
    );
  await recordServerEvent("assessment_delete_request", taskId);
  try {
    const run = await start(deleteAssessmentDataWorkflow, [taskId]);
    return NextResponse.json(
      { ok: true, accepted: true, taskId, runId: run.runId },
      { status: 202 },
    );
  } catch {
    try {
      await completeAssessmentDeletionTask(taskId);
      await recordServerEvent("assessment_deleted", taskId);
      return NextResponse.json({
        ok: true,
        accepted: true,
        taskId,
        completedSynchronously: true,
      });
    } catch (error) {
      await sendOperationalAlert({
        type: "assessment_deletion_failed",
        severity: "critical",
        subjectId: taskId,
        errorCode: error instanceof Error ? error.name : "UNKNOWN",
      });
      return NextResponse.json(
        {
          error: "删除任务已进入重试队列，请稍后再次确认状态。",
          code: "DELETION_RETRY_PENDING",
          taskId,
        },
        { status: 503 },
      );
    }
  }
}
