import "server-only";

import { verify } from "@node-rs/argon2";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { env } from "@/lib/env";

interface AdminRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: "active" | "disabled";
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let admin: AdminRecord | null = null;

  if (isMongoConfigured()) {
    const db = await getDb();
    admin = await db.collection<AdminRecord>("admin_users").findOne({ email: normalizedEmail, status: "active" }, { projection: { _id: 0 } });
  }

  if (!admin && env.ADMIN_EMAIL && env.ADMIN_PASSWORD_HASH && normalizedEmail === env.ADMIN_EMAIL.toLowerCase()) {
    admin = { id: "env-admin", email: normalizedEmail, name: "Ling", passwordHash: env.ADMIN_PASSWORD_HASH, status: "active" };
  }

  if (!admin && process.env.NODE_ENV !== "production" && normalizedEmail === "admin@aianliku.local") {
    return password === "aianliku-demo" ? { id: "dev-admin", email: normalizedEmail, name: "Ling", role: "admin" as const } : null;
  }

  if (!admin || !(await verify(admin.passwordHash, password))) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as const };
}
