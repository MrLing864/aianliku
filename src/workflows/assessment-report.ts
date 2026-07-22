import { generateAssessment } from "@/lib/ai/assessment";
import type { AssessmentInput } from "@/lib/assessment";
import { env, hasAI } from "@/lib/env";
import {
  getAssessmentJobForWorkflow,
  completeAssessmentDeletionTask,
  markAssessmentJobFailed,
  markAssessmentJobProcessing,
  persistAssessmentReport,
} from "@/lib/repositories/reports";
import { recordServerEvent } from "@/lib/server-analytics";
import { sendOperationalAlert } from "@/lib/operational-alerts";

export interface AssessmentWorkflowResult {
  jobId: string;
  reportId: string;
}

export async function generateAssessmentReportWorkflow(
  jobId: string,
): Promise<AssessmentWorkflowResult> {
  try {
    await markAssessmentJobProcessing(jobId);
    const reportId = await generateAndPersistReport(jobId);
    return { jobId, reportId };
  } catch (error) {
    await markGenerationFailed(jobId);
    throw error;
  }
}

export async function deleteAssessmentDataWorkflow(taskId: string) {
  await completeAssessmentDeletion(taskId);
  return { taskId, status: "completed" as const };
}

async function generateAndPersistReport(jobId: string) {
  if (!hasAI) throw new Error("DEEPSEEK_NOT_CONFIGURED");
  const job = await getAssessmentJobForWorkflow(jobId);
  if (!job) throw new Error("ASSESSMENT_JOB_NOT_FOUND");
  if (job.status === "deleted") throw new Error("ASSESSMENT_JOB_DELETED");

  const report = await generateAssessment(
    jobId,
    job.input as unknown as AssessmentInput,
    { strict: true },
  );
  await persistAssessmentReport(jobId, report);
  await recordServerEvent("assessment_job_ready", jobId);
  console.info("assessment_report_generated", { jobId, model: env.AI_MODEL });
  return report.id;
}

async function markGenerationFailed(jobId: string) {
  console.error("assessment_report_generation_failed", { jobId });
  await markAssessmentJobFailed(jobId, "REPORT_GENERATION_FAILED");
  await recordServerEvent("assessment_job_failed", jobId);
  await sendOperationalAlert({
    type: "assessment_generation_failed",
    severity: "critical",
    subjectId: jobId,
    errorCode: "REPORT_GENERATION_FAILED",
  });
}

async function completeAssessmentDeletion(taskId: string) {
  try {
    await completeAssessmentDeletionTask(taskId);
    await recordServerEvent("assessment_deleted", taskId);
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
