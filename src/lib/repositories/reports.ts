import "server-only";

import { createHash } from "node:crypto";
import type { AssessmentInput } from "@/lib/assessment";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type {
  AssessmentJob,
  AssessmentReport,
  NotificationStatus,
} from "@/lib/types";

type StoredReport = AssessmentReport & { accessTokenHash?: string };

export function hashReportToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAssessmentJob(input: {
  id: string;
  email: string;
  answers: AssessmentInput;
  statusToken: string;
  reportToken: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  const job: AssessmentJob = {
    id: input.id,
    status: "queued",
    statusTokenHash: hashReportToken(input.statusToken),
    reportTokenHash: hashReportToken(input.reportToken),
    reportToken: input.reportToken,
    email: input.email,
    input: input.answers as unknown as Record<string, unknown>,
    notificationStatus: "pending",
    notificationAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<AssessmentJob>("assessment_jobs").insertOne(job);
  await db.collection("assessment_sessions").updateOne(
    { id: input.id },
    {
      $set: {
        id: input.id,
        input: input.answers,
        email: input.email,
        status: "queued",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  return job;
}

export async function setAssessmentJobRunId(jobId: string, runId: string) {
  const db = await getDb();
  await db.collection<AssessmentJob>("assessment_jobs").updateOne(
    { id: jobId, status: "queued" },
    { $set: { runId, updatedAt: new Date().toISOString() } },
  );
}

export async function getAssessmentJobForWorkflow(jobId: string) {
  const db = await getDb();
  return db.collection<AssessmentJob>("assessment_jobs").findOne(
    { id: jobId, deletedAt: { $exists: false } },
    { projection: { _id: 0 } },
  );
}

export async function getAssessmentJobByStatusToken(token: string) {
  if (!isMongoConfigured()) return null;
  const db = await getDb();
  return db.collection<AssessmentJob>("assessment_jobs").findOne(
    { statusTokenHash: hashReportToken(token), deletedAt: { $exists: false } },
    {
      projection: {
        _id: 0,
        email: 0,
        input: 0,
        reportToken: 0,
        reportTokenHash: 0,
        statusTokenHash: 0,
      },
    },
  );
}

export async function markAssessmentJobProcessing(jobId: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  await Promise.all([
    db.collection<AssessmentJob>("assessment_jobs").updateOne(
      { id: jobId, status: { $in: ["queued", "processing"] } },
      { $set: { status: "processing", startedAt: now, updatedAt: now }, $unset: { errorCode: "" } },
    ),
    db.collection("assessment_sessions").updateOne(
      { id: jobId },
      { $set: { status: "processing", updatedAt: new Date() } },
    ),
  ]);
}

export async function persistAssessmentReport(jobId: string, report: AssessmentReport) {
  const db = await getDb();
  const job = await getAssessmentJobForWorkflow(jobId);
  if (!job || job.status === "deleted") throw new Error("ASSESSMENT_JOB_NOT_AVAILABLE");

  const completedAt = new Date().toISOString();
  const stored: StoredReport = {
    ...report,
    email: job.email,
    claimedAt: completedAt,
    accessTokenHash: job.reportTokenHash,
  };

  await db.collection<StoredReport>("assessment_reports").replaceOne(
    { id: report.id },
    stored,
    { upsert: true },
  );
  await Promise.all([
    db.collection<AssessmentJob>("assessment_jobs").updateOne(
      { id: jobId, deletedAt: { $exists: false } },
      {
        $set: {
          status: "ready",
          reportId: report.id,
          completedAt,
          updatedAt: completedAt,
        },
      },
    ),
    db.collection("assessment_sessions").updateOne(
      { id: jobId },
      {
        $set: {
          status: "report_ready",
          reportId: report.id,
          updatedAt: new Date(),
        },
      },
    ),
  ]);
}

export async function markAssessmentJobFailed(jobId: string, errorCode: string) {
  if (!isMongoConfigured()) return;
  const db = await getDb();
  const now = new Date().toISOString();
  await Promise.all([
    db.collection<AssessmentJob>("assessment_jobs").updateOne(
      { id: jobId, status: { $ne: "ready" }, deletedAt: { $exists: false } },
      { $set: { status: "failed", errorCode, updatedAt: now } },
    ),
    db.collection("assessment_sessions").updateOne(
      { id: jobId },
      { $set: { status: "failed", errorCode, updatedAt: new Date() } },
    ),
  ]);
}

export async function getNotificationPayload(jobId: string) {
  const job = await getAssessmentJobForWorkflow(jobId);
  if (!job?.reportId || !job.reportToken) return null;
  const report = await getReportById(job.reportId);
  if (!report) return null;
  return { report: { ...report, email: job.email }, reportToken: job.reportToken };
}

export async function recordNotificationResult(
  jobId: string,
  status: Exclude<NotificationStatus, "pending">,
) {
  const db = await getDb();
  const now = new Date().toISOString();
  if (status === "sent") {
    await db.collection<AssessmentJob>("assessment_jobs").updateOne(
      { id: jobId },
      {
        $set: { notificationStatus: status, notifiedAt: now, updatedAt: now },
        $inc: { notificationAttempts: 1 },
        $unset: { reportToken: "" },
      },
    );
    return;
  }
  await db.collection<AssessmentJob>("assessment_jobs").updateOne(
    { id: jobId },
    {
      $set: { notificationStatus: status, updatedAt: now },
      $inc: { notificationAttempts: 1 },
    },
  );
}

export async function queueAssessmentNotificationRetry(jobId: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.collection<AssessmentJob>("assessment_jobs").updateOne(
    {
      id: jobId,
      status: "ready",
      notificationStatus: { $in: ["failed", "not_configured"] },
      reportToken: { $type: "string" },
      deletedAt: { $exists: false },
    },
    {
      $set: { notificationStatus: "pending", updatedAt: now },
      $unset: { notificationRetryError: "" },
    },
  );
  return result.modifiedCount === 1;
}

export async function getReportById(id: string) {
  if (!isMongoConfigured()) return null;
  const db = await getDb();
  return db.collection<AssessmentReport>("assessment_reports").findOne(
    { id, deletedAt: { $exists: false } },
    { projection: { _id: 0 } },
  );
}

export async function getReportByToken(token: string) {
  if (!isMongoConfigured()) return null;
  const db = await getDb();
  return db.collection<StoredReport>("assessment_reports").findOne(
    { accessTokenHash: hashReportToken(token), deletedAt: { $exists: false } },
    { projection: { _id: 0, accessTokenHash: 0 } },
  );
}

export async function deleteReportByToken(token: string) {
  if (!isMongoConfigured()) return false;
  const db = await getDb();
  const tokenHash = hashReportToken(token);
  const report = await db.collection<StoredReport>("assessment_reports").findOne({
    accessTokenHash: tokenHash,
    deletedAt: { $exists: false },
  });
  if (!report) return false;
  const deletedAt = new Date().toISOString();
  const [result] = await Promise.all([
    db.collection("assessment_reports").updateOne(
      { accessTokenHash: tokenHash },
      { $set: { deletedAt, email: null }, $unset: { accessTokenHash: "" } },
    ),
    db.collection("assessment_sessions").updateOne(
      { id: report.sessionId },
      { $set: { status: "deleted", deletedAt }, $unset: { input: "", email: "" } },
    ),
    db.collection("assessment_jobs").updateOne(
      { reportId: report.id },
      {
        $set: { status: "deleted", deletedAt, updatedAt: deletedAt },
        $unset: {
          input: "",
          email: "",
          reportToken: "",
          reportTokenHash: "",
          statusTokenHash: "",
        },
      },
    ),
  ]);
  return result.modifiedCount === 1;
}
