import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { isMongoConfigured } from "@/lib/db/mongodb";
import {
  queueAssessmentNotificationRetry,
  recordNotificationResult,
} from "@/lib/repositories/reports";
import { retryAssessmentNotificationWorkflow } from "@/workflows/assessment-report";

export const maxDuration = 30;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 });
  }

  const { id } = await params;
  const queued = await queueAssessmentNotificationRetry(id);
  if (!queued) {
    return NextResponse.json(
      { error: "该任务当前不可重试，可能正在发送、已送达或私密令牌已删除。" },
      { status: 409 },
    );
  }

  try {
    const run = await start(retryAssessmentNotificationWorkflow, [id]);
    await writeAuditLog({
      actor: session.user?.email ?? "admin",
      action: "assessment.notification_retry",
      entityType: "assessment_job",
      entityId: id,
      metadata: { runId: run.runId },
    });
    return NextResponse.json({ ok: true, runId: run.runId }, { status: 202 });
  } catch (error) {
    await recordNotificationResult(id, "failed").catch(() => undefined);
    console.error("assessment_notification_retry_start_failed", {
      jobId: id,
      error: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json({ error: "通知重试任务启动失败，请稍后再试。" }, { status: 503 });
  }
}
