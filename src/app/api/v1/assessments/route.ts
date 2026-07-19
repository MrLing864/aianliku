import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { hasAI, hasMongo } from "@/lib/env";
import {
  createAssessmentJob,
  markAssessmentJobFailed,
  setAssessmentJobRunId,
} from "@/lib/repositories/reports";
import { assessmentSubmissionSchema } from "@/lib/validation/assessment";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateAssessmentReportWorkflow } from "@/workflows/assessment-report";

export const maxDuration = 30;

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "assessment_submit", 5, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "报告提交过于频繁，请稍后再试。" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } });
  const parsed = assessmentSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请补充完整的问诊信息和有效邮箱", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (!hasMongo) {
    return NextResponse.json(
      { error: "报告队列正在配置，暂时无法提交。请稍后再试。", code: "REPORT_QUEUE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  if (!hasAI) {
    return NextResponse.json(
      { error: "AI 报告服务暂时不可用，请稍后再试。", code: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const { email, reportConsent, privacyConsent, marketingConsent, ...answers } = parsed.data;
  const jobId = nanoid(24);
  const statusToken = nanoid(36);
  const reportToken = nanoid(48);

  try {
    await createAssessmentJob({
      id: jobId,
      email: email.trim().toLowerCase(),
      answers,
      statusToken,
      reportToken,
      consent: { reportConsent, privacyConsent, marketingConsent },
    });
    const run = await start(generateAssessmentReportWorkflow, [jobId]);
    await setAssessmentJobRunId(jobId, run.runId);

    return NextResponse.json(
      {
        ok: true,
        jobId,
        runId: run.runId,
        statusToken,
        reportToken,
        statusUrl: `/api/v1/assessment-jobs/${statusToken}`,
        estimatedMinutes: 3,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("assessment_job_start_failed", {
      jobId,
      error: error instanceof Error ? error.name : "unknown_error",
    });
    await markAssessmentJobFailed(jobId, "WORKFLOW_START_FAILED").catch(() => undefined);
    return NextResponse.json(
      { error: "报告任务启动失败，请稍后重试。", code: "WORKFLOW_START_FAILED" },
      { status: 503 },
    );
  }
}
