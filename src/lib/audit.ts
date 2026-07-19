import "server-only";
import { nanoid } from "nanoid";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
export async function writeAuditLog(input: { actor: string; action: string; entityType: string; entityId: string; before?: unknown; after?: unknown; metadata?: unknown }) { if (!isMongoConfigured()) return; const db = await getDb(); await db.collection("audit_logs").insertOne({ id: nanoid(), ...input, createdAt: new Date() }); }
