import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";

const schema = z.object({ status: z.enum(["new", "investigating", "corrected", "rejected", "closed"]), note: z.string().max(1_000).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "请先配置 CloudBase" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "状态无效" }, { status: 400 });
  const id = (await params).id;
  const db = await getDb();
  const before = await db.collection("contact_requests").findOne({ id, type: "correction" }, { projection: { contact: 0, message: 0 } });
  if (!before) return NextResponse.json({ error: "更正工单不存在" }, { status: 404 });
  await db.collection("contact_requests").updateOne({ id, type: "correction" }, { $set: { ...parsed.data, updatedBy: session.user?.email, updatedAt: new Date() } });
  await writeAuditLog({ actor: session.user?.email ?? "admin", action: "correction.update", entityType: "contact_request", entityId: id, before: { status: before.status }, after: parsed.data });
  return NextResponse.json({ ok: true });
}
