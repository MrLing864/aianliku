import "server-only";
import { demoCases } from "@/data/demo-cases";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import type {
  Appointment,
  AssessmentJob,
  CaseStudy,
  DuplicateCandidate,
  SourceRecord,
} from "@/lib/types";

export async function getAdminStats() {
  if (!isDbConfigured())
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
      status: "failed",
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
  if (!isDbConfigured()) return demoCases;
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
  if (!isDbConfigured())
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
  if (!isDbConfigured()) return [];
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
  if (!isDbConfigured()) return [];
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
  | "errorCode"
  | "createdAt"
  | "startedAt"
  | "completedAt"
  | "updatedAt"
> & {
  phoneMasked: string;
};

export async function listAssessmentJobs(
  limit = 100,
): Promise<AdminAssessmentJob[]> {
  if (!isDbConfigured()) return [];
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
    errorCode: job.errorCode,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    updatedAt: job.updatedAt,
    phoneMasked: maskPhone(job.phone),
  }));
}

function maskPhone(phone: string) {
  const cleaned = phone.replace(/[\s-]/gu, "");
  if (cleaned.length < 7) return "***";
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-4)}`;
}

export async function listSources(limit = 200): Promise<SourceRecord[]> {
  if (!isDbConfigured()) return [];
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
  if (!isDbConfigured()) return [];
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
  if (!isDbConfigured()) return [];
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
      { $group: { _id: "$implementers.name", caseCount: { $sum: 1 } } },
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
  if (!isDbConfigured()) return [];
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
  if (!isDbConfigured()) return [];
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
  if (!isDbConfigured()) return [];
  const db = await getDb();
  return db
    .collection<AdminImportJob>("import_jobs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<AdminImportJob>({ _id: 0 })
    .toArray();
}

export async function getAnalyticsSummary(): Promise<{
  qualified7d: number;
  qualified30d: number;
  searches30d: number;
  zeroSearches30d: number;
  assessments30d: number;
  appointments30d: number;
  topCases: Array<{ caseId: string; readers: number }>;
}> {
  if (!isDbConfigured())
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

/* ------------------------------------------------------------------ */
/* 采集运行监控（collector_runs）                                       */
/* ------------------------------------------------------------------ */

export type CollectorCategory =
  | "internet_giant"
  | "government"
  | "university"
  | "famous_company";

export interface CollectorRunRecord {
  runId: string;
  category: CollectorCategory;
  categoryName: string;
  source: string;
  sourceName: string;
  scheduledBy: "cron" | "manual";
  triggeredAt: Date;
  finishedAt?: Date;
  status: "running" | "success" | "partial" | "failed";
  counts: {
    candidates: number;
    aiCases: number;
    success: number;
    created: number;
    updated: number;
    failed: number;
    skipped: number;
  };
  errorMessage?: string;
}

export interface CollectorDailyRow {
  date: string; // YYYY-MM-DD
  category: CollectorCategory;
  categoryName: string;
  success: number;
  failed: number;
  dedup: number; // 去重（更新）数
  runs: number; // 当日该分类运行次数
}

export interface CollectorDailyResult {
  rangeDays: number;
  byDateCategory: CollectorDailyRow[];
  byCategory: Array<{
    category: CollectorCategory;
    categoryName: string;
    success: number;
    failed: number;
    dedup: number;
    runs: number;
  }>;
}

const ALL_CATEGORY_NAMES: Record<CollectorCategory, string> = {
  internet_giant: "互联网大厂",
  government: "政府机关",
  university: "高等院校",
  famous_company: "知名企业",
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 列出采集运行明细（按触发时间倒序），可按分类/触发方式过滤 */
export async function listCollectorRuns(params?: {
  category?: CollectorCategory;
  scheduledBy?: "cron" | "manual";
  limit?: number;
}): Promise<CollectorRunRecord[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (params?.category) filter.category = params.category;
  if (params?.scheduledBy) filter.scheduledBy = params.scheduledBy;
  return db
    .collection<CollectorRunRecord>("collector_runs")
    .find(filter)
    .sort({ triggeredAt: -1 })
    .limit(params?.limit ?? 200)
    .toArray();
}

/**
 * 按天 × 分类聚合采集运行统计。
 * 返回两种视图：byDateCategory（按天明细）、byCategory（分类汇总，对齐“每天都是哪些定时器在更新”）。
 */
export async function getCollectorRunDaily(days = 7): Promise<CollectorDailyResult> {
  if (!isDbConfigured())
    return { rangeDays: days, byDateCategory: [], byCategory: [] };
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);

  const rows = await db
    .collection<CollectorRunRecord>("collector_runs")
    .aggregate<{
      _id: { date: string; category: CollectorCategory };
      categoryName: string;
      success: number;
      failed: number;
      dedup: number;
      runs: number;
    }>([
      { $match: { triggeredAt: { $gte: since } } },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$triggeredAt" },
          },
          category: 1,
          categoryName: 1,
          success: { $ifNull: ["$counts.success", 0] },
          failed: { $ifNull: ["$counts.failed", 0] },
          dedup: { $ifNull: ["$counts.updated", 0] },
        },
      },
      {
        $group: {
          _id: { date: "$date", category: "$category" },
          categoryName: { $first: "$categoryName" },
          success: { $sum: "$success" },
          failed: { $sum: "$failed" },
          dedup: { $sum: "$dedup" },
          runs: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": -1, "_id.category": 1 } },
    ])
    .toArray();

  const byDateCategory: CollectorDailyRow[] = rows.map((r) => ({
    date: r._id.date,
    category: r._id.category,
    categoryName: r.categoryName || ALL_CATEGORY_NAMES[r._id.category] || r._id.category,
    success: r.success,
    failed: r.failed,
    dedup: r.dedup,
    runs: r.runs,
  }));

  // 分类汇总（跨所选日期范围累计）
  const catMap = new Map<CollectorCategory, CollectorDailyResult["byCategory"][number]>();
  for (const r of byDateCategory) {
    const cur =
      catMap.get(r.category) ||
      {
        category: r.category,
        categoryName: r.categoryName,
        success: 0,
        failed: 0,
        dedup: 0,
        runs: 0,
      };
    cur.success += r.success;
    cur.failed += r.failed;
    cur.dedup += r.dedup;
    cur.runs += r.runs;
    catMap.set(r.category, cur);
  }
  const byCategory = Array.from(catMap.values());

  return { rangeDays: days, byDateCategory, byCategory };
}
