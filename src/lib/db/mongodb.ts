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
    db.collection("sources").createIndex({ normalizedUrl: 1 }, { unique: true, partialFilterExpression: { normalizedUrl: { $type: "string" } }, name: "source_url_unique" }),
    db.collection("sources").createIndex({ publisher: 1, externalId: 1 }, { unique: true, partialFilterExpression: { externalId: { $type: "string" } }, name: "source_external_id_unique" }),
    db.collection("sources").createIndex({ contentHash: 1 }, { unique: true, partialFilterExpression: { contentHash: { $type: "string" } }, name: "source_hash_unique" }),
    db.collection("import_rows").createIndex({ idempotencyKey: 1 }, { unique: true, name: "import_row_idempotency" }),
    db.collection("assessment_reports").createIndex({ accessTokenHash: 1 }, { unique: true, partialFilterExpression: { accessTokenHash: { $type: "string" } }, name: "report_token_hash" }),
    db.collection("assessment_jobs").createIndex({ id: 1 }, { unique: true, name: "assessment_job_id" }),
    db.collection("assessment_jobs").createIndex({ statusTokenHash: 1 }, { unique: true, name: "assessment_job_status_token" }),
    db.collection("assessment_jobs").createIndex({ status: 1, createdAt: -1 }, { name: "assessment_job_queue" }),
    db.collection("assessment_jobs").createIndex({ email: 1, createdAt: -1 }, { name: "assessment_job_email" }),
    db.collection("appointments").createIndex({ reportId: 1, createdAt: -1 }, { name: "appointment_report" }),
    db.collection("audit_logs").createIndex({ createdAt: -1 }, { name: "audit_recent" }),
  ]);
}
