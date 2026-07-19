import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { getAdminSession } from "@/lib/auth/dal";
import { verifyAdminReauthentication } from "@/lib/auth/admin";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { AssessmentJob } from "@/lib/types";

const schema = z.object({ password: z.string().min(8).max(128) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请输入管理员密码" }, { status: 400 });
  if (!(await verifyAdminReauthentication(session.user.email, parsed.data.password, "assessment_raw_answers"))) {
    return NextResponse.json({ error: "二次验证失败" }, { status: 403 });
  }
  if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 });

  const id = (await params).id;
  const db = await getDb();
  const job = await db.collection<AssessmentJob>("assessment_jobs").findOne(
    { id, deletedAt: { $exists: false } },
    { projection: { _id: 0, id: 1, input: 1, createdAt: 1 } },
  );
  if (!job) return NextResponse.json({ error: "任务不存在或已删除" }, { status: 404 });
  await writeAuditLog({
    actor: session.user.email,
    action: "assessment.raw_answers_viewed",
    entityType: "assessment_job",
    entityId: id,
    metadata: { fieldNames: Object.keys(job.input) },
  });
  return NextResponse.json({ id: job.id, answers: job.input, createdAt: job.createdAt }, { headers: { "Cache-Control": "private, no-store" } });
}
