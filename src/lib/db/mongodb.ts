import "server-only";

import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var __aianlikuMongoPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(env.MONGODB_URI);
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!globalThis.__aianlikuMongoPromise) {
    const client = new MongoClient(env.MONGODB_URI, {
      appName: "aianliku",
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    });
    globalThis.__aianlikuMongoPromise = client.connect();
  }

  return globalThis.__aianlikuMongoPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(env.MONGODB_DB);
}

export async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("cases").createIndex({ slug: 1 }, { unique: true, name: "case_slug_unique" }),
    db.collection("cases").createIndex({ id: 1 }, { unique: true, name: "case_public_id_unique" }),
    db.collection("cases").createIndex({ contentStatus: 1, publishedAt: -1 }, { name: "case_public_list" }),
    db.collection("cases").createIndex({ "organization.id": 1, "scenarios.slug": 1 }, { name: "case_dedup_scope" }),
    db.collection("case_versions").createIndex({ caseId: 1, version: 1 }, { unique: true, name: "case_version_unique" }),
    db.collection("case_redirects").createIndex({ fromSlug: 1 }, { unique: true, name: "case_redirect_from_slug_unique" }),
    db.collection("case_redirects").createIndex({ targetSlug: 1, createdAt: -1 }, { name: "case_redirect_target" }),
    db.collection("sources").createIndex({ normalizedUrl: 1 }, { unique: true, partialFilterExpression: { normalizedUrl: { $type: "string" } }, name: "source_url_unique" }),
    db.collection("sources").createIndex({ id: 1 }, { unique: true, name: "source_public_id_unique" }),
    db.collection("sources").createIndex({ publisher: 1, externalId: 1 }, { unique: true, partialFilterExpression: { publisher: { $type: "string" }, externalId: { $type: "string" } }, name: "source_external_id_unique" }),
    db.collection("sources").createIndex({ contentHash: 1 }, { unique: true, partialFilterExpression: { contentHash: { $type: "string" } }, name: "source_hash_unique" }),
    db.collection("import_rows").createIndex({ idempotencyKey: 1 }, { unique: true, name: "import_row_idempotency" }),
    db.collection("import_rows").createIndex({ originKey: 1 }, { unique: true, partialFilterExpression: { originKey: { $type: "string" } }, name: "import_row_origin_unique" }),
    db.collection("import_jobs").createIndex({ id: 1 }, { unique: true, name: "import_job_id_unique" }),
    db.collection("raw_import_records").createIndex({ jobId: 1, rowNumber: 1 }, { name: "raw_import_job_row" }),
    db.collection("duplicate_candidates").createIndex({ id: 1 }, { unique: true, name: "duplicate_candidate_id_unique" }),
    db.collection("duplicate_candidates").createIndex({ status: 1, "scores.overall": -1 }, { name: "duplicate_review_queue" }),
    db.collection("ai_extractions").createIndex({ id: 1 }, { unique: true, name: "ai_extraction_id_unique" }),
    db.collection("ai_extractions").createIndex({ inputHash: 1, createdAt: -1 }, { name: "ai_extraction_input_history" }),
    db.collection("assessment_reports").createIndex({ accessTokenHash: 1 }, { unique: true, partialFilterExpression: { accessTokenHash: { $type: "string" } }, name: "report_token_hash" }),
    db.collection("assessment_jobs").createIndex({ id: 1 }, { unique: true, name: "assessment_job_id" }),
    db.collection("assessment_jobs").createIndex({ statusTokenHash: 1 }, { unique: true, name: "assessment_job_status_token" }),
    db.collection("assessment_jobs").createIndex({ status: 1, createdAt: -1 }, { name: "assessment_job_queue" }),
    db.collection("assessment_jobs").createIndex({ email: 1, createdAt: -1 }, { name: "assessment_job_email" }),
    db.collection("deletion_tasks").createIndex({ id: 1 }, { unique: true, name: "deletion_task_id_unique" }),
    db.collection("deletion_tasks").createIndex({ status: 1, updatedAt: 1 }, { name: "deletion_task_retry_queue" }),
    db.collection("appointments").createIndex({ reportId: 1, createdAt: -1 }, { name: "appointment_report" }),
    db.collection("admin_login_limits").createIndex({ key: 1 }, { unique: true, name: "admin_login_limit_key" }),
    db.collection("admin_login_limits").createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86_400, name: "admin_login_limit_ttl" }),
    db.collection("rate_limits").createIndex({ key: 1 }, { unique: true, name: "rate_limit_key" }),
    db.collection("rate_limits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0, name: "rate_limit_ttl" }),
    db.collection("analytics_events").createIndex({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } }, name: "analytics_qualified_reader_daily_unique" }),
    db.collection("analytics_events").createIndex({ name: 1, occurredAt: -1 }, { name: "analytics_event_time" }),
    db.collection("audit_logs").createIndex({ createdAt: -1 }, { name: "audit_recent" }),
  ]);
}
