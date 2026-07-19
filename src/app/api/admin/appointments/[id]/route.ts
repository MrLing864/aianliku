import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
const schema = z.object({ status: z.enum(["new", "pending", "contacted", "completed", "invalid", "cancelled"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { const session = await getAdminSession(); if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 }); if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "无效状态" }, { status: 400 }); const id = (await params).id; const db = await getDb(); const before = await db.collection("appointments").findOne({ id }); if (!before) return NextResponse.json({ error: "预约不存在" }, { status: 404 }); await db.collection("appointments").updateOne({ id }, { $set: { status: parsed.data.status, updatedAt: new Date() } }); await writeAuditLog({ actor: session.user?.email ?? "admin", action: "appointment.update", entityType: "appointment", entityId: id, before, after: parsed.data }); return NextResponse.json({ ok: true }); }
