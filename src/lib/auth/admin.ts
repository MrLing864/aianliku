import "server-only";

import { verify } from "@node-rs/argon2";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { env } from "@/lib/env";

interface AdminRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: "active" | "disabled";
}

interface LoginLimit {
  key: string;
  failedAttempts: number;
  windowStartedAt: Date;
  blockedUntil?: Date;
  updatedAt: Date;
}

declare global {
  var __aianlikuLoginLimits: Map<string, LoginLimit> | undefined;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function memoryLimits() {
  globalThis.__aianlikuLoginLimits ??= new Map<string, LoginLimit>();
  return globalThis.__aianlikuLoginLimits;
}

async function getLoginLimit(key: string) {
  if (!isMongoConfigured()) return memoryLimits().get(key) ?? null;
  const db = await getDb();
  return db.collection<LoginLimit>("admin_login_limits").findOne({ key }, { projection: { _id: 0 } });
}

async function setLoginLimit(limit: LoginLimit) {
  if (!isMongoConfigured()) { memoryLimits().set(limit.key, limit); return; }
  const db = await getDb();
  await db.collection<LoginLimit>("admin_login_limits").updateOne({ key: limit.key }, { $set: limit }, { upsert: true });
}

async function clearLoginLimit(key: string) {
  if (!isMongoConfigured()) { memoryLimits().delete(key); return; }
  const db = await getDb();
  await db.collection("admin_login_limits").deleteOne({ key });
}

async function registerFailedLogin(key: string) {
  const now = new Date();
  const previous = await getLoginLimit(key);
  const withinWindow = previous && now.getTime() - previous.windowStartedAt.getTime() < WINDOW_MS;
  const failedAttempts = withinWindow ? previous.failedAttempts + 1 : 1;
  const blockedUntil = failedAttempts >= MAX_ATTEMPTS ? new Date(now.getTime() + WINDOW_MS) : undefined;
  await setLoginLimit({ key, failedAttempts, windowStartedAt: withinWindow ? previous.windowStartedAt : now, blockedUntil, updatedAt: now });
  await writeAuditLog({ actor: key, action: blockedUntil ? "admin.login_blocked" : "admin.login_failed", entityType: "admin_session", entityId: key, metadata: { failedAttempts, blockedUntil } });
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const currentLimit = await getLoginLimit(normalizedEmail);
  if (currentLimit?.blockedUntil && currentLimit.blockedUntil.getTime() > Date.now()) {
    await writeAuditLog({ actor: normalizedEmail, action: "admin.login_blocked", entityType: "admin_session", entityId: normalizedEmail, metadata: { blockedUntil: currentLimit.blockedUntil } });
    return null;
  }
  let admin: AdminRecord | null = null;

  if (isMongoConfigured()) {
    const db = await getDb();
    admin = await db.collection<AdminRecord>("admin_users").findOne({ email: normalizedEmail, status: "active" }, { projection: { _id: 0 } });
  }

  if (!admin && env.ADMIN_EMAIL && env.ADMIN_PASSWORD_HASH && normalizedEmail === env.ADMIN_EMAIL.toLowerCase()) {
    admin = { id: "env-admin", email: normalizedEmail, name: "Ling", passwordHash: env.ADMIN_PASSWORD_HASH, status: "active" };
  }

  if (!admin && process.env.NODE_ENV !== "production" && normalizedEmail === "admin@aianliku.local") {
    if (password === "aianliku-demo") { await clearLoginLimit(normalizedEmail); return { id: "dev-admin", email: normalizedEmail, name: "Ling", role: "admin" as const }; }
    await registerFailedLogin(normalizedEmail);
    return null;
  }

  if (!admin || !(await verify(admin.passwordHash, password))) { await registerFailedLogin(normalizedEmail); return null; }
  await clearLoginLimit(normalizedEmail);
  await writeAuditLog({ actor: admin.email, action: "admin.login", entityType: "admin_session", entityId: admin.id });
  return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as const };
}
