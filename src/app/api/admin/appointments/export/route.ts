import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminReauthentication } from "@/lib/auth/admin";
import { getAdminSession } from "@/lib/auth/dal";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { Appointment } from "@/lib/types";

const schema = z.object({
  password: z.string().min(8).max(128),
  statuses: z.array(z.enum(["new", "pending", "contacted", "completed", "invalid", "cancelled"])).max(6).optional(),
});

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "导出参数无效" }, { status: 400 });
  if (!(await verifyAdminReauthentication(session.user.email, parsed.data.password, "appointment_contact_export"))) {
    return NextResponse.json({ error: "二次验证失败" }, { status: 403 });
  }
  if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 });

  const db = await getDb();
  const filter = parsed.data.statuses?.length ? { status: { $in: parsed.data.statuses } } : {};
  const items = await db.collection<Appointment>("appointments").find(filter).sort({ createdAt: -1 }).limit(5_000).project<Appointment>({ _id: 0, id: 1, name: 1, company: 1, need: 1, phone: 1, wechat: 1, status: 1, createdAt: 1 }).toArray();
  const rows = [
    ["编号", "姓名", "企业", "需求摘要", "手机号", "微信", "状态", "提交时间"],
    ...items.map((item) => [item.id, item.name, item.company, item.need, item.phone, item.wechat, item.status, item.createdAt]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  await writeAuditLog({
    actor: session.user.email,
    action: "appointment.contacts_exported",
    entityType: "appointment_export",
    entityId: `export-${Date.now()}`,
    metadata: { count: items.length, statuses: parsed.data.statuses ?? "all", fields: ["id", "name", "company", "need", "phone", "wechat", "status", "createdAt"] },
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aianliku-appointments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
