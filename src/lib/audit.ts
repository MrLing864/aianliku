import "server-only";

import { nanoid } from "nanoid";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";

const blockedKey = /(password|secret|token|authorization|cookie|email|phone|wechat|question|answer|input|markdown|rawtext|payload|content)$/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";
  if (typeof value === "string") return value.slice(0, 500);
  if (Array.isArray(value)) return value.slice(0, 50).map((entry) => sanitize(entry, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !blockedKey.test(key)).map(([key, entry]) => [key, sanitize(entry, depth + 1)]));
  return value;
}

export async function writeAuditLog(input: { actor: string; action: string; entityType: string; entityId: string; before?: unknown; after?: unknown; metadata?: unknown }) {
  if (!isMongoConfigured()) return;
  const db = await getDb();
  await db.collection("audit_logs").insertOne({ id: nanoid(), actor: input.actor, action: input.action, entityType: input.entityType, entityId: input.entityId, before: sanitize(input.before), after: sanitize(input.after), metadata: sanitize(input.metadata), createdAt: new Date() });
}
