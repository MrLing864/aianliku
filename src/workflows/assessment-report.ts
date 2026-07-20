import { FatalError } from "workflow";
import { generateAssessment } from "@/lib/ai/assessment";
import type { AssessmentInput } from "@/lib/assessment";
import { sendReportEmail } from "@/lib/email/report-email";
import { env, hasAI } from "@/lib/env";
import {
  getAssessmentJobForWorkflow,
  completeAssessmentDeletionTask,
  getNotificationPayload,
  markAssessmentJobFailed,
  markAssessmentJobProcessing,
  persistAssessmentReport,
  recordNotificationResult,
} from "@/lib/repositories/reports";
import { recordServerEvent } from "@/lib/server-analytics";
import { sendOperationalAlert } from "@/lib/operational-alerts";

export interface AssessmentWorkflowResult {
  jobId: string;
  reportId: string;
  notification: "sent" | "failed" | "not_configured";
}

export async function generateAssessmentReportWorkflow(
  jobId: string,
): Promise<AssessmentWorkflowResult> {
  "use workflow";

  try {
    await markProcessingStep(jobId);
    const reportId = await generateAndPersistReportStep(jobId);
    let notification: AssessmentWorkflowResult["notification"] = "failed";
    try {
      notification = await sendCompletionNotificationStep(jobId);
    } catch {
      await markNotificationFailedStep(jobId);
    }
    return { jobId, reportId, notification };
  } catch (error) {
    await markGenerationFailedStep(jobId);
    throw error;
  }
}

export async function retryAssessmentNotificationWorkflow(
  jobId: string,
): Promise<Pick<AssessmentWorkflowResult, "jobId" | "notification">> {
  "use workflow";

  try {
    const notification = await sendCompletionNotificationStep(jobId);
    return { jobId, notification };
  } catch (error) {
    await markNotificationFailedStep(jobId);
    throw error;
  }
}

export async function deleteAssessmentDataWorkflow(taskId: string) {
  "use workflow";
  await completeAssessmentDeletionStep(taskId);
  return { taskId, status: "completed" as const };
}

async function markProcessingStep(jobId: string) {
  "use step";
  console.info("assessment_workflow_step_start", {
    step: "mark_processing",
    jobId,
  });
  await markAssessmentJobProcessing(jobId);
  console.info("assessment_workflow_step_done", {
    step: "mark_processing",
    jobId,
  });
}

async function generateAndPersistReportStep(jobId: string) {
  "use step";
  console.info("assessment_workflow_step_start", {
    step: "generate_report",
    jobId,
  });
  if (!hasAI) throw new FatalError("DEEPSEEK_NOT_CONFIGURED");

  const job = await getAssessmentJobForWorkflow(jobId);
  if (!job) throw new FatalError("ASSESSMENT_JOB_NOT_FOUND");
  if (job.status === "deleted") throw new FatalError("ASSESSMENT_JOB_DELETED");

  const report = await generateAssessment(
    jobId,
    job.input as unknown as AssessmentInput,
    { strict: true },
  );
  await persistAssessmentReport(jobId, report);
  await recordServerEvent("assessment_job_ready", jobId);
  console.info("assessment_workflow_step_done", {
    step: "generate_report",
    jobId,
    model: env.AI_MODEL,
  });
  return report.id;
}

async function sendCompletionNotificationStep(jobId: string) {
  "use step";
  console.info("assessment_workflow_step_start", {
    step: "send_notification",
    jobId,
  });
  const payload = await getNotificationPayload(jobId);
  if (!payload)
    throw new FatalError("ASSESSMENT_NOTIFICATION_PAYLOAD_NOT_FOUND");

  const reportUrl = `${env.NEXT_PUBLIC_SITE_URL}/reports/${payload.reportToken}`;
  const result = await sendReportEmail(payload.report, reportUrl);
  const status = result.sent ? "sent" : "not_configured";
  await recordNotificationResult(jobId, status);
  if (status === "sent")
    await recordServerEvent("assessment_email_sent", jobId);
  console.info("assessment_workflow_step_done", {
    step: "send_notification",
    jobId,
    status,
  });
  return status;
}

async function markNotificationFailedStep(jobId: string) {
  "use step";
  console.error("assessment_workflow_step_failed", {
    step: "send_notification",
    jobId,
  });
  await recordNotificationResult(jobId, "failed");
  await sendOperationalAlert({
    type: "assessment_notification_failed",
    severity: "warning",
    subjectId: jobId,
    errorCode: "REPORT_NOTIFICATION_FAILED",
  });
}

async function markGenerationFailedStep(jobId: string) {
  "use step";
  console.error("assessment_workflow_failed", { jobId });
  await markAssessmentJobFailed(jobId, "REPORT_GENERATION_FAILED");
  await recordServerEvent("assessment_job_failed", jobId);
  await sendOperationalAlert({
    type: "assessment_generation_failed",
    severity: "critical",
    subjectId: jobId,
    errorCode: "REPORT_GENERATION_FAILED",
  });
}

async function completeAssessmentDeletionStep(taskId: string) {
  "use step";
  console.info("assessment_deletion_step_start", { taskId });
  try {
    await completeAssessmentDeletionTask(taskId);
    await recordServerEvent("assessment_deleted", taskId);
    console.info("assessment_deletion_step_done", { taskId });
  } catch (error) {
    await sendOperationalAlert({
      type: "assessment_deletion_failed",
      severity: "critical",
      subjectId: taskId,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
    throw error;
  }
}
