import "server-only";
import { demoCases } from "@/data/demo-cases";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type {
  Appointment,
  AssessmentJob,
  CaseStudy,
  DuplicateCandidate,
  SourceRecord,
} from "@/lib/types";

export async function getAdminStats() {
  if (!isMongoConfigured())
    return {
      cases: demoCases.length,
      drafts: 0,
      review: 0,
      duplicates: 0,
      appointments: 0,
      reportJobs: 0,
      reportIssues: 0,
      corrections: 0,
      importFailures: 0,
      sourceIssues: 0,
      mode: "demo" as const,
    };
  const db = await getDb();
  const [
    cases,
    drafts,
    review,
    duplicates,
    appointments,
    reportJobs,
    reportIssues,
    corrections,
    importFailures,
    sourceIssues,
  ] = await Promise.all([
    db.collection("cases").countDocuments({ contentStatus: "published" }),
    db.collection("cases").countDocuments({ contentStatus: "draft" }),
    db.collection("cases").countDocuments({ contentStatus: "in_review" }),
    db.collection("duplicate_candidates").countDocuments({ status: "pending" }),
    db.collection("appointments").countDocuments({ status: "new" }),
    db.collection("assessment_jobs").countDocuments({
      status: { $in: ["queued", "processing"] },
      deletedAt: { $exists: false },
    }),
    db.collection("assessment_jobs").countDocuments({
      $or: [
        { status: "failed" },
        {
          status: "ready",
          notificationStatus: { $in: ["failed", "not_configured"] },
        },
      ],
      deletedAt: { $exists: false },
    }),
    db.collection("contact_requests").countDocuments({
      type: "correction",
      status: { $in: ["new", "investigating"] },
    }),
    db.collection("import_jobs").countDocuments({ status: "partial" }),
    db
      .collection("sources")
      .countDocuments({ accessibility: { $ne: "available" } }),
  ]);
  return {
    cases,
    drafts,
    review,
    duplicates,
    appointments,
    reportJobs,
    reportIssues,
    corrections,
    importFailures,
    sourceIssues,
    mode: "mongodb" as const,
  };
}
export async function listAdminCases(limit = 100): Promise<CaseStudy[]> {
  if (!isMongoConfigured()) return demoCases;
  const db = await getDb();
  return db
    .collection<CaseStudy>("cases")
    .find({ contentStatus: { $ne: "deleted" } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .project<CaseStudy>({ _id: 0, dedupVector: 0 })
    .toArray();
}
export async function getAdminCase(id: string): Promise<CaseStudy | null> {
  if (!isMongoConfigured())
    return demoCases.find((item) => item.id === id || item.slug === id) ?? null;
  const db = await getDb();
  return db
    .collection<CaseStudy>("cases")
    .findOne(
      { $or: [{ id }, { slug: id }], contentStatus: { $ne: "deleted" } },
      { projection: { _id: 0, dedupVector: 0 } },
    );
}
export async function listAppointments(limit = 100): Promise<Appointment[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<Appointment>("appointments")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<Appointment>({ _id: 0 })
    .toArray();
}
export async function listDuplicateCandidates(
  limit = 100,
): Promise<DuplicateCandidate[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<DuplicateCandidate>("duplicate_candidates")
    .find({ status: "pending" })
    .sort({ "scores.overall": -1 })
    .limit(limit)
    .project<DuplicateCandidate>({ _id: 0 })
    .toArray();
}

export type AdminAssessmentJob = Pick<
  AssessmentJob,
  | "id"
  | "status"
  | "reportId"
  | "notificationStatus"
  | "notificationAttempts"
  | "errorCode"
  | "createdAt"
  | "startedAt"
  | "completedAt"
  | "notifiedAt"
  | "updatedAt"
> & {
  emailMasked: string;
  canRetryNotification: boolean;
};

export async function listAssessmentJobs(
  limit = 100,
): Promise<AdminAssessmentJob[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  const jobs = await db
    .collection<AssessmentJob>("assessment_jobs")
    .find(
      { deletedAt: { $exists: false } },
      {
        projection: {
          _id: 0,
          statusTokenHash: 0,
          reportTokenHash: 0,
          reportToken: 0,
          input: 0,
          runId: 0,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return jobs.map((job) => ({
    id: job.id,
    status: job.status,
    reportId: job.reportId,
    notificationStatus: job.notificationStatus,
    notificationAttempts: job.notificationAttempts,
    errorCode: job.errorCode,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    notifiedAt: job.notifiedAt,
    updatedAt: job.updatedAt,
    emailMasked: maskEmail(job.email),
    canRetryNotification:
      job.status === "ready" &&
      ["failed", "not_configured"].includes(job.notificationStatus),
  }));
}

function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export async function listSources(limit = 200): Promise<SourceRecord[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<SourceRecord>("sources")
    .find({})
    .sort({ lastCollectedAt: -1 })
    .limit(limit)
    .project<SourceRecord>({ _id: 0 })
    .toArray();
}

export interface AdminOrganizationSummary {
  id: string;
  name: string;
  size: string;
  caseCount: number;
  industries: string[];
  latestUpdatedAt: string;
}

export async function listOrganizations(
  limit = 200,
): Promise<AdminOrganizationSummary[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<CaseStudy>("cases")
    .aggregate<AdminOrganizationSummary>([
      { $match: { contentStatus: { $ne: "deleted" } } },
      {
        $group: {
          _id: "$organization.id",
          name: { $first: "$organization.name" },
          size: { $first: "$organization.size" },
          caseCount: { $sum: 1 },
          industries: { $addToSet: "$industry.displayName" },
          latestUpdatedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { caseCount: -1, latestUpdatedAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          size: 1,
          caseCount: 1,
          industries: 1,
          latestUpdatedAt: 1,
        },
      },
    ])
    .toArray();
}

export interface AdminImplementerSummary {
  name: string;
  caseCount: number;
}
export async function listImplementers(
  limit = 100,
): Promise<AdminImplementerSummary[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<CaseStudy>("cases")
    .aggregate<AdminImplementerSummary>([
      {
        $match: {
          contentStatus: { $ne: "deleted" },
          "implementers.0": { $exists: true },
        },
      },
      { $unwind: "$implementers" },
      { $group: { _id: "$implementers", caseCount: { $sum: 1 } } },
      { $sort: { caseCount: -1 } },
      { $limit: limit },
      { $project: { _id: 0, name: "$_id", caseCount: 1 } },
    ])
    .toArray();
}

export interface AdminContactRequest {
  id: string;
  type: string;
  name: string;
  company?: string;
  contact: string;
  message: string;
  caseId?: string;
  status: "new" | "investigating" | "corrected" | "rejected" | "closed";
  createdAt: Date;
  updatedAt?: Date;
}
export async function listContactRequests(
  type?: string,
  limit = 200,
): Promise<AdminContactRequest[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<AdminContactRequest>("contact_requests")
    .find(type ? { type } : {})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<AdminContactRequest>({ _id: 0 })
    .toArray();
}

export interface AdminAuditEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
export async function listAuditLogs(limit = 250): Promise<AdminAuditEntry[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<AdminAuditEntry>("audit_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<AdminAuditEntry>({ _id: 0, before: 0, after: 0 })
    .toArray();
}

export interface AdminImportJob {
  id: string;
  format: string;
  templateVersion: string;
  total: number;
  status: string;
  counts: Record<string, number>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
export async function listImportJobs(limit = 50): Promise<AdminImportJob[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  return db
    .collection<AdminImportJob>("import_jobs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<AdminImportJob>({ _id: 0 })
    .toArray();
}

export async function getAnalyticsSummary() {
  if (!isMongoConfigured())
    return {
      qualified7d: 0,
      qualified30d: 0,
      searches30d: 0,
      zeroSearches30d: 0,
      assessments30d: 0,
      appointments30d: 0,
      topCases: [] as Array<{ caseId: string; readers: number }>,
    };
  const db = await getDb();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86_400_000);
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000);
  const events = db.collection("analytics_events");
  const [
    qualified7d,
    qualified30d,
    searches30d,
    zeroSearches30d,
    assessments30d,
    appointments30d,
    topCases,
  ] = await Promise.all([
    events.countDocuments({
      name: "qualified_case_reader",
      occurredAt: { $gte: sevenDaysAgo },
    }),
    events.countDocuments({
      name: "qualified_case_reader",
      occurredAt: { $gte: thirtyDaysAgo },
    }),
    events.countDocuments({
      name: "search",
      occurredAt: { $gte: thirtyDaysAgo },
    }),
    events.countDocuments({
      name: "search_zero_result",
      occurredAt: { $gte: thirtyDaysAgo },
    }),
    events.countDocuments({
      name: {
        $in: [
          "assessment_started",
          "assessment_completed",
          "report_claimed",
          "assessment_job_queued",
          "assessment_job_ready",
          "assessment_job_failed",
          "assessment_email_sent",
        ],
      },
      occurredAt: { $gte: thirtyDaysAgo },
    }),
    events.countDocuments({
      name: "expert_booking_submit",
      source: "server",
      occurredAt: { $gte: thirtyDaysAgo },
    }),
    events
      .aggregate<{ caseId: string; readers: number }>([
        {
          $match: {
            name: "qualified_case_reader",
            occurredAt: { $gte: thirtyDaysAgo },
            caseId: { $type: "string" },
          },
        },
        { $group: { _id: "$caseId", readers: { $sum: 1 } } },
        { $sort: { readers: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, caseId: "$_id", readers: 1 } },
      ])
      .toArray(),
  ]);
  return {
    qualified7d,
    qualified30d,
    searches30d,
    zeroSearches30d,
    assessments30d,
    appointments30d,
    topCases,
  };
}
