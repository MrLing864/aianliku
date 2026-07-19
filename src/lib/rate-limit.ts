import "server-only";

import { createHmac } from "node:crypto";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { env } from "@/lib/env";

interface RateLimitRecord { key: string; count: number; resetAt: Date; updatedAt: Date }

declare global { var __aianlikuRateLimits: Map<string, RateLimitRecord> | undefined }

function memoryStore() {
  globalThis.__aianlikuRateLimits ??= new Map<string, RateLimitRecord>();
  return globalThis.__aianlikuRateLimits;
}

function requesterKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 200) ?? "unknown";
  return `${scope}:${createHmac("sha256", env.AUTH_SECRET ?? "aianliku-local-rate-limit").update(`${forwarded}|${userAgent}`).digest("hex")}`;
}

export async function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const key = requesterKey(request, scope);
  const now = new Date();
  let existing: RateLimitRecord | null | undefined;
  if (isMongoConfigured()) {
    const db = await getDb();
    existing = await db.collection<RateLimitRecord>("rate_limits").findOne({ key }, { projection: { _id: 0 } });
  } else existing = memoryStore().get(key);
  const activeRecord = existing && existing.resetAt.getTime() > now.getTime() ? existing : null;
  const record: RateLimitRecord = { key, count: activeRecord ? activeRecord.count + 1 : 1, resetAt: activeRecord ? activeRecord.resetAt : new Date(now.getTime() + windowMs), updatedAt: now };
  if (isMongoConfigured()) {
    const db = await getDb();
    await db.collection<RateLimitRecord>("rate_limits").updateOne({ key }, { $set: record }, { upsert: true });
  } else memoryStore().set(key, record);
  return { allowed: record.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt.getTime() - now.getTime()) / 1_000)), remaining: Math.max(0, limit - record.count) };
}
