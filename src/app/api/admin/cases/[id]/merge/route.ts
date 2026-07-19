import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminReauthentication } from "@/lib/auth/admin";
import { getAdminSession } from "@/lib/auth/dal";
import { getDb, getMongoClient, isMongoConfigured } from "@/lib/db/mongodb";
import type { CaseStudy } from "@/lib/types";

const schema = z.object({
  targetCaseId: z.string().min(1).max(100),
  reason: z.string().min(10).max(1_000),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请选择主案例、填写至少 10 个字的合并依据并输入密码" }, { status: 400 });
  if (!(await verifyAdminReauthentication(admin.user.email, parsed.data.password, "case_merge"))) {
    return NextResponse.json({ error: "二次验证失败" }, { status: 403 });
  }
  if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 });

  const sourceId = (await params).id;
  if (sourceId === parsed.data.targetCaseId) return NextResponse.json({ error: "不能把案例合并到自身" }, { status: 400 });
  const db = await getDb();
  const client = await getMongoClient();
  const mongoSession = client.startSession();
  let source: CaseStudy | null = null;
  let target: CaseStudy | null = null;

  try {
    await mongoSession.withTransaction(async () => {
      const cases = db.collection<CaseStudy>("cases");
      source = await cases.findOne({ id: sourceId, contentStatus: { $nin: ["deleted", "merged"] } }, { session: mongoSession });
      target = await cases.findOne({ id: parsed.data.targetCaseId, contentStatus: "published" }, { session: mongoSession });
      if (!source || !target) throw new Error("CASE_NOT_MERGEABLE");
      const currentSource = source;
      const currentTarget = target;
      const now = new Date().toISOString();
      const sourceVersion = currentSource.version ?? 1;
      const targetVersion = currentTarget.version ?? 1;
      const newSources = currentSource.sources.filter((incoming) => !currentTarget.sources.some((existing) => existing.id === incoming.id));
      const sourceVersionFilter = currentSource.version === undefined ? { id: currentSource.id, version: { $exists: false } } : { id: currentSource.id, version: currentSource.version };
      const targetVersionFilter = currentTarget.version === undefined ? { id: currentTarget.id, version: { $exists: false } } : { id: currentTarget.id, version: currentTarget.version };
      const targetResult = await cases.updateOne(
        targetVersionFilter,
        { $addToSet: { sources: { $each: newSources }, mergedCaseIds: currentSource.id }, $set: { updatedAt: now, version: targetVersion + 1 } },
        { session: mongoSession },
      );
      const sourceResult = await cases.updateOne(
        sourceVersionFilter,
        { $set: { contentStatus: "merged", mergedIntoCaseId: currentTarget.id, mergedIntoSlug: currentTarget.slug, mergedAt: now, updatedAt: now, version: sourceVersion + 1 } },
        { session: mongoSession },
      );
      if (targetResult.matchedCount !== 1 || sourceResult.matchedCount !== 1) throw new Error("VERSION_CONFLICT");
      await Promise.all([
        db.collection("case_redirects").updateOne(
          { fromSlug: currentSource.slug },
          { $set: { targetCaseId: currentTarget.id, targetSlug: currentTarget.slug, reason: parsed.data.reason, updatedAt: new Date() }, $setOnInsert: { fromCaseId: currentSource.id, createdBy: admin.user.email, createdAt: new Date() } },
          { upsert: true, session: mongoSession },
        ),
        db.collection("case_versions").insertOne({ caseId: currentSource.id, version: sourceVersion + 1, snapshot: { ...currentSource, version: sourceVersion + 1, contentStatus: "merged", mergedIntoCaseId: currentTarget.id, mergedIntoSlug: currentTarget.slug, mergedAt: now, updatedAt: now }, createdBy: admin.user.email, createdAt: new Date() }, { session: mongoSession }),
        db.collection("case_versions").insertOne({ caseId: currentTarget.id, version: targetVersion + 1, snapshot: { ...currentTarget, version: targetVersion + 1, sources: [...currentTarget.sources, ...newSources], mergedCaseIds: [...new Set([...(currentTarget.mergedCaseIds ?? []), currentSource.id])], updatedAt: now }, createdBy: admin.user.email, createdAt: new Date() }, { session: mongoSession }),
        db.collection("sources").updateMany({ caseIds: currentSource.id }, { $addToSet: { caseIds: currentTarget.id } }, { session: mongoSession }),
      ]);
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MERGE_FAILED";
    if (code === "CASE_NOT_MERGEABLE") return NextResponse.json({ error: "原案例不可合并，或主案例尚未发布" }, { status: 409 });
    if (code === "VERSION_CONFLICT") return NextResponse.json({ error: "案例已被其他会话修改，请刷新后重试", code }, { status: 409 });
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  if (!source || !target) return NextResponse.json({ error: "合并未完成" }, { status: 500 });
  const sourceCase = source as CaseStudy;
  const targetCase = target as CaseStudy;
  await writeAuditLog({ actor: admin.user.email, action: "case.merged", entityType: "case", entityId: sourceCase.id, before: { sourceCaseId: sourceCase.id, sourceSlug: sourceCase.slug, sourceStatus: sourceCase.contentStatus }, after: { targetCaseId: targetCase.id, targetSlug: targetCase.slug, sourceStatus: "merged" }, metadata: { reason: parsed.data.reason } });
  return NextResponse.json({ ok: true, targetCaseId: targetCase.id, targetSlug: targetCase.slug });
}
