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
  const rows = await db
    .collection<Partial<DuplicateCandidate> & Pick<DuplicateCandidate, "id" | "incomingTitle" | "incomingOrganization" | "existingCaseId" | "existingCaseTitle" | "status" | "createdAt">>("duplicate_candidates")
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .project({ _id: 0 })
    .toArray();
  return rows
    .map((row): DuplicateCandidate => {
      const overall = row.scores?.overall ?? row.overallScore ?? row.ruleScore ?? 0;
      return {
        ...row,
        id: row.id,
        incomingTitle: row.incomingTitle,
        incomingOrganization: row.incomingOrganization,
        existingCaseId: row.existingCaseId,
        existingCaseTitle: row.existingCaseTitle,
        status: row.status,
        createdAt: row.createdAt,
        scores: row.scores || {
          organization: row.relationship === "different_project" ? 0 : 1,
          semantic: row.ruleScore ?? 0,
          scenario: 0,
          function: 0,
          time: 0,
          implementer: row.modelScore ?? 0,
          metrics: row.verificationScore ?? 0,
          overall,
        },
      };
    })
    .sort((left, right) => right.scores.overall - left.scores.overall);
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

const EMPTY_RUN_COUNTS: CollectorRunRecord["counts"] = {
  candidates: 0,
  aiCases: 0,
  success: 0,
  created: 0,
  updated: 0,
  failed: 0,
  skipped: 0,
};

/**
 * 归一化一条 collector_runs 记录。
 *
 * 历史数据存在两种形态：
 *  1. 正常形态：counts / status / finishedAt 在文档顶层；
 *  2. 异常形态：因写入侧曾使用 doc().update({ data: {...} })，实际把负载写成了
 *     名为 `data` 的嵌套字段，导致顶层 counts 缺失、status 永远停留在 "running"。
 *
 * 后台页面会直接读取 r.counts.candidates 等字段，一旦 counts 为 undefined 就会
 * 抛 TypeError 导致整页 500。这里统一兜底，保证任何脏数据都能安全渲染。
 */
function normalizeRunRecord(raw: Record<string, unknown>): CollectorRunRecord {
  const nested = (raw.data && typeof raw.data === "object" ? raw.data : {}) as Record<string, unknown>;

  const rawCounts = (raw.counts ?? nested.counts) as Partial<CollectorRunRecord["counts"]> | undefined;
  const counts: CollectorRunRecord["counts"] = { ...EMPTY_RUN_COUNTS };
  if (rawCounts && typeof rawCounts === "object") {
    for (const key of Object.keys(EMPTY_RUN_COUNTS) as (keyof CollectorRunRecord["counts"])[]) {
      const v = rawCounts[key];
      if (typeof v === "number" && Number.isFinite(v)) counts[key] = v;
    }
  }
  // 兼容旧口径：success 曾被写成 0，而实际成功数 = created + updated
  if (counts.success === 0 && counts.created + counts.updated > 0) {
    counts.success = counts.created + counts.updated;
  }

  // 最终状态优先取嵌套里的真实结果，顶层的 "running" 往往是未被覆盖的初始值
  const status = (nested.status ?? raw.status ?? "running") as CollectorRunRecord["status"];
  const finishedAt = (raw.finishedAt ?? nested.finishedAt) as Date | undefined;
  const errorMessage = (raw.errorMessage ?? nested.errorMessage) as string | undefined;

  return {
    runId: (raw.runId as string) ?? (raw._id as string) ?? "",
    category: raw.category as CollectorCategory,
    categoryName:
      (raw.categoryName as string) ||
      ALL_CATEGORY_NAMES[raw.category as CollectorCategory] ||
      (raw.category as string) ||
      "未知",
    source: (raw.source as string) ?? "",
    sourceName: (raw.sourceName as string) || (raw.source as string) || "未知来源",
    scheduledBy: (raw.scheduledBy as "cron" | "manual") ?? "cron",
    triggeredAt: raw.triggeredAt as Date,
    finishedAt,
    status,
    counts,
    errorMessage,
  };
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
  const rows = await db
    .collection<CollectorRunRecord>("collector_runs")
    .find(filter)
    .sort({ triggeredAt: -1 })
    .limit(params?.limit ?? 200)
    .toArray();
  return (rows as unknown as Record<string, unknown>[]).map(normalizeRunRecord);
}

/**
 * 按天 × 分类聚合采集运行统计。
 * 返回两种视图：byDateCategory（按天明细）、byCategory（分类汇总，对齐“每天都是哪些定时器在更新”）。
 */
export async function getCollectorRunDaily(days = 7): Promise<CollectorDailyResult> {
  if (!isDbConfigured())
    return { rangeDays: days, byDateCategory: [], byCategory: [] };
  const since = new Date(Date.now() - days * 86_400_000);

  // 说明：这里刻意不使用数据库聚合（$dateToString / $ifNull）。
  // 因为历史记录中 counts 可能嵌套在 data.counts 下，聚合表达式取 $counts.success
  // 会一律得到 0，统计结果失真。改为取回记录后用 normalizeRunRecord 统一归一化，
  // 再在内存中按天 × 分类聚合，数据量（数百条/月）完全可以承受。
  const runs = await listCollectorRuns({ limit: 2000 });

  const bucket = new Map<string, CollectorDailyRow>();
  for (const r of runs) {
    const t = r.triggeredAt ? new Date(r.triggeredAt) : null;
    if (!t || Number.isNaN(t.getTime()) || t < since) continue;
    const date = ymd(t);
    const key = `${date}__${r.category}`;
    const cur =
      bucket.get(key) ||
      {
        date,
        category: r.category,
        categoryName: r.categoryName,
        success: 0,
        failed: 0,
        dedup: 0,
        runs: 0,
      };
    cur.success += r.counts.success;
    cur.failed += r.counts.failed;
    cur.dedup += r.counts.updated;
    cur.runs += 1;
    bucket.set(key, cur);
  }

  const byDateCategory: CollectorDailyRow[] = Array.from(bucket.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // 日期倒序
    return a.category < b.category ? -1 : a.category > b.category ? 1 : 0;
  });

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
