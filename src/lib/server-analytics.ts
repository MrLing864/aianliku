import { MongoServerError } from "mongodb";
import { nanoid } from "nanoid";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";

export type ServerEventName =
  | "contact_submitted"
  | "assessment_job_queued"
  | "assessment_job_ready"
  | "assessment_job_failed"
  | "assessment_email_sent"
  | "assessment_delete_request"
  | "assessment_deleted"
  | "expert_booking_submit";

export async function recordServerEvent(
  name: ServerEventName,
  subjectId: string,
) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    await db.collection("analytics_events").insertOne({
      id: nanoid(),
      name,
      source: "server",
      subjectId,
      dedupeKey: `server:${name}:${subjectId}`,
      schemaVersion: 1,
      occurredAt: new Date(),
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return;
    console.error("server_analytics_record_failed", {
      name,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
  }
}
