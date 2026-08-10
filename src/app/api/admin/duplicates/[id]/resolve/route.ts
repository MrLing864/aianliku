import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { publishReviewedCase } from "@/lib/dedup/pipeline";
import type { CaseSource, CaseStudy, SourceType } from "@/lib/types";

const schema = z.object({
  action: z.enum([
    "supplement_existing",
    "distinct_project",
    "independent_case",
    "defer",
    "invalid_record",
  ]),
  note: z.string().max(1000).optional(),
});

function sourceType(value: unknown): SourceType {
  const allowed: SourceType[] = [
    "government",
    "company",
    "implementer",
    "disclosure",
    "institution",
    "media",
    "reprint",
    "demo",
  ];
  return typeof value === "string" && allowed.includes(value as SourceType)
    ? (value as SourceType)
    : "media";
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "请先配置 CloudBase" }, { status: 503 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "无效处理动作" }, { status: 400 });
  }

  const id = (await params).id;
  const db = await getDb();
  const candidate = await db.collection<Record<string, unknown>>("duplicate_candidates").findOne({
    id,
    status: "pending",
  });
  if (!candidate) {
    return NextResponse.json({ error: "候选记录不存在或已处理" }, { status: 404 });
  }

  const action = parsed.data.action;
  const importRowId = asText(candidate.importRowId);
  const sourceId = asText(candidate.sourceId);
  const segmentId = asText(candidate.incomingSegmentId);
  const existingCaseId = asText(candidate.existingCaseId);
  const row = importRowId
    ? await db.collection<Record<string, unknown>>("import_rows").findOne({ id: importRowId })
    : null;
  const sourceRecord = sourceId
    ? await db.collection<Record<string, unknown>>("sources").findOne({ id: sourceId })
    : null;

  let publishedCaseId: string | undefined;
  if (action === "supplement_existing") {
    if (!existingCaseId || (!sourceRecord && !row)) {
      return NextResponse.json(
        { error: "缺少已有案例或来源记录，无法补充来源" },
        { status: 422 },
      );
    }
    const supports = Array.isArray(sourceRecord?.supports)
      ? sourceRecord.supports.filter((item): item is string => typeof item === "string")
      : [];
    const source: CaseSource = sourceRecord
      ? {
          id: asText(sourceRecord.id) || nanoid(14),
          title: asText(sourceRecord.title) || asText(row?.sourceTitle) || asText(row?.title) || "补充来源",
          publisher: asText(sourceRecord.publisher) || asText(row?.publisher) || "未披露",
          type: sourceType(sourceRecord.type),
          url: asText(sourceRecord.originalUrl),
          publishedAt: asText(sourceRecord.publishedAt),
          collectedAt:
            asText(sourceRecord.collectedAt) ||
            asText(sourceRecord.lastCollectedAt) ||
            new Date().toISOString(),
          accessibility:
            sourceRecord.accessibility === "redirected" ||
            sourceRecord.accessibility === "unavailable" ||
            sourceRecord.accessibility === "restricted"
              ? sourceRecord.accessibility
              : "available",
          supports: supports.length ? supports : ["补充来源，待编辑复核"],
        }
      : {
          id: nanoid(14),
          title: asText(row?.sourceTitle) || asText(row?.title) || "补充来源",
          publisher: asText(row?.publisher) || asText(row?.organization) || "未披露",
          type: "media",
          url: asText(row?.sourceUrl),
          publishedAt: asText(row?.publishedAt),
          collectedAt: new Date().toISOString(),
          accessibility: "available",
          supports: ["补充来源，待编辑复核"],
        };
    await db.collection<CaseStudy>("cases").updateOne(
      { id: existingCaseId },
      { $addToSet: { sources: source }, $set: { updatedAt: new Date().toISOString() } },
    );
    if (sourceId) {
      await db.collection("sources").updateOne(
        { id: sourceId },
        { $addToSet: { caseIds: existingCaseId } },
      );
    }
    if (segmentId) {
      await Promise.all([
        db.collection("source_case_segments").updateOne(
          { id: segmentId },
          { $set: { caseId: existingCaseId, status: "merged", updatedAt: new Date().toISOString() } },
        ),
        db.collection("raw_import_records").updateOne(
          { linkedSegmentId: segmentId },
          {
            $set: {
              linkedCaseId: existingCaseId,
              status: "deduped",
              updatedAt: new Date().toISOString(),
            },
          },
        ),
      ]);
    }
  } else if (action === "distinct_project" || action === "independent_case") {
    publishedCaseId = await publishReviewedCase(id);
  }

  const statusMap = {
    supplement_existing: "merged",
    distinct_project: "distinct",
    independent_case: "distinct",
    defer: "deferred",
    invalid_record: "invalid",
  } as const;
  const importStatusMap = {
    supplement_existing: "merged_as_source",
    distinct_project: "staged_distinct_project",
    independent_case: "staged_independent",
    defer: "deferred",
    invalid_record: "invalid",
  } as const;
  const updates: Promise<unknown>[] = [
    db.collection("duplicate_candidates").updateOne(
      { id },
      {
        $set: {
          status: statusMap[action],
          resolution: action,
          note: parsed.data.note,
          resolvedBy: session.user?.email,
          resolvedAt: new Date().toISOString(),
          publishedCaseId,
        },
      },
    ),
  ];
  if (importRowId) {
    updates.push(
      db.collection("import_rows").updateOne(
        { id: importRowId },
        { $set: { status: importStatusMap[action], resolvedAt: new Date() } },
      ),
    );
  }
  await Promise.all(updates);
  await writeAuditLog({
    actor: session.user?.email ?? "admin",
    action: `duplicate.${action}`,
    entityType: "duplicate_candidate",
    entityId: id,
    before: candidate,
    metadata: { ...parsed.data, publishedCaseId },
  });
  return NextResponse.json({ ok: true, publishedCaseId });
}
