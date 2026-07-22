import { NextResponse } from "next/server";
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
    await deleteAssessmentDataWorkflow(taskId);
    return NextResponse.json(
      { ok: true, accepted: true, taskId },
      { status: 202 },
    );
  } catch (error) {
    await sendOperationalAlert({
      type: "assessment_deletion_failed",
      severity: "critical",
      subjectId: taskId,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
    return NextResponse.json(
      {
        error: "删除任务处理失败，请稍后再次尝试。",
        code: "DELETION_FAILED",
        taskId,
      },
      { status: 503 },
    );
  }
}
