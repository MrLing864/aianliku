import "server-only";
import { demoCases } from "@/data/demo-cases";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { Appointment, AssessmentJob, CaseStudy, DuplicateCandidate } from "@/lib/types";

export async function getAdminStats() { if (!isMongoConfigured()) return { cases: demoCases.length, drafts: 0, review: 0, duplicates: 0, appointments: 0, reportJobs: 0, reportIssues: 0, mode: "demo" as const }; const db = await getDb(); const [cases, drafts, review, duplicates, appointments, reportJobs, reportIssues] = await Promise.all([db.collection("cases").countDocuments({ contentStatus: "published" }), db.collection("cases").countDocuments({ contentStatus: "draft" }), db.collection("cases").countDocuments({ contentStatus: "in_review" }), db.collection("duplicate_candidates").countDocuments({ status: "pending" }), db.collection("appointments").countDocuments({ status: "new" }), db.collection("assessment_jobs").countDocuments({ status: { $in: ["queued", "processing"] }, deletedAt: { $exists: false } }), db.collection("assessment_jobs").countDocuments({ $or: [{ status: "failed" }, { status: "ready", notificationStatus: { $in: ["failed", "not_configured"] } }], deletedAt: { $exists: false } })]); return { cases, drafts, review, duplicates, appointments, reportJobs, reportIssues, mode: "mongodb" as const }; }
export async function listAdminCases(limit = 100): Promise<CaseStudy[]> { if (!isMongoConfigured()) return demoCases; const db = await getDb(); return db.collection<CaseStudy>("cases").find({ contentStatus: { $ne: "deleted" } }).sort({ updatedAt: -1 }).limit(limit).project<CaseStudy>({ _id: 0 }).toArray(); }
export async function getAdminCase(id: string): Promise<CaseStudy | null> { if (!isMongoConfigured()) return demoCases.find((item) => item.id === id || item.slug === id) ?? null; const db = await getDb(); return db.collection<CaseStudy>("cases").findOne({ $or: [{ id }, { slug: id }], contentStatus: { $ne: "deleted" } }, { projection: { _id: 0 } }); }
export async function listAppointments(limit = 100): Promise<Appointment[]> { if (!isMongoConfigured()) return []; const db = await getDb(); return db.collection<Appointment>("appointments").find({}).sort({ createdAt: -1 }).limit(limit).project<Appointment>({ _id: 0 }).toArray(); }
export async function listDuplicateCandidates(limit = 100): Promise<DuplicateCandidate[]> { if (!isMongoConfigured()) return []; const db = await getDb(); return db.collection<DuplicateCandidate>("duplicate_candidates").find({ status: "pending" }).sort({ "scores.overall": -1 }).limit(limit).project<DuplicateCandidate>({ _id: 0 }).toArray(); }

export type AdminAssessmentJob = Pick<AssessmentJob, "id" | "status" | "reportId" | "notificationStatus" | "notificationAttempts" | "errorCode" | "createdAt" | "startedAt" | "completedAt" | "notifiedAt" | "updatedAt"> & {
  emailMasked: string;
  canRetryNotification: boolean;
};

export async function listAssessmentJobs(limit = 100): Promise<AdminAssessmentJob[]> {
  if (!isMongoConfigured()) return [];
  const db = await getDb();
  const jobs = await db.collection<AssessmentJob>("assessment_jobs").find(
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
  ).sort({ createdAt: -1 }).limit(limit).toArray();

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
    canRetryNotification: job.status === "ready" && ["failed", "not_configured"].includes(job.notificationStatus),
  }));
}

function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
