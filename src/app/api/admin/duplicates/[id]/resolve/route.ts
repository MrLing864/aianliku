import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { CaseSource, CaseStudy, SourceRecord } from "@/lib/types";
const schema = z.object({ action: z.enum(["supplement_existing", "distinct_project", "independent_case", "defer", "invalid_record"]), note: z.string().max(1000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const session = await getAdminSession(); if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 }); if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB" }, { status: 503 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "无效处理动作" }, { status: 400 }); const id = (await params).id; const db = await getDb(); const candidate = await db.collection("duplicate_candidates").findOne({ id, status: "pending" }); if (!candidate) return NextResponse.json({ error: "候选记录不存在或已处理" }, { status: 404 }); const statusMap = { supplement_existing: "merged", distinct_project: "distinct", independent_case: "distinct", defer: "deferred", invalid_record: "invalid" } as const; const importStatusMap = { supplement_existing: "merged_as_source", distinct_project: "staged_distinct_project", independent_case: "staged_independent", defer: "deferred", invalid_record: "invalid" } as const;
  if (parsed.data.action === "supplement_existing") {
    const row = await db.collection("import_rows").findOne({ id: candidate.importRowId });
    const sourceRecord = candidate.sourceId ? await db.collection<SourceRecord>("sources").findOne({ id: candidate.sourceId }, { projection: { _id: 0 } }) : null;
    if (row) {
      const source: CaseSource = sourceRecord ? { id: sourceRecord.id, title: sourceRecord.title, publisher: sourceRecord.publisher, type: sourceRecord.type, url: sourceRecord.originalUrl, publishedAt: sourceRecord.publishedAt, collectedAt: sourceRecord.collectedAt, accessibility: sourceRecord.accessibility, supports: sourceRecord.supports.length ? sourceRecord.supports : ["补充来源，待编辑复核"] } : { id: nanoid(14), title: String(row.sourceTitle || row.title), publisher: String(row.publisher || row.organization || "未披露"), type: "media", url: row.sourceUrl ? String(row.sourceUrl) : undefined, publishedAt: row.publishedAt ? String(row.publishedAt) : undefined, collectedAt: new Date().toISOString(), accessibility: "available", supports: ["补充来源，待编辑复核"] };
      await db.collection<CaseStudy>("cases").updateOne({ id: candidate.existingCaseId }, { $addToSet: { sources: source }, $set: { updatedAt: new Date().toISOString() } });
      if (sourceRecord) await db.collection("sources").updateOne({ id: sourceRecord.id }, { $addToSet: { caseIds: candidate.existingCaseId } });
    }
  }
  await Promise.all([db.collection("duplicate_candidates").updateOne({ id }, { $set: { status: statusMap[parsed.data.action], resolution: parsed.data.action, note: parsed.data.note, resolvedBy: session.user?.email, resolvedAt: new Date() } }), db.collection("import_rows").updateOne({ id: candidate.importRowId }, { $set: { status: importStatusMap[parsed.data.action], resolvedAt: new Date() } })]); await writeAuditLog({ actor: session.user?.email ?? "admin", action: `duplicate.${parsed.data.action}`, entityType: "duplicate_candidate", entityId: id, before: candidate, metadata: parsed.data }); return NextResponse.json({ ok: true }); }
