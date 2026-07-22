import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { MongoServerError } from "@/lib/db/cloudbase";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import {
  duplicateLevel,
  createDedupVector,
  normalizeContent,
  normalizeOrganization,
  scoreDuplicate,
  sourceIdentity,
} from "@/lib/dedup";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { listAdminCases } from "@/lib/repositories/admin";
import { findVectorSimilarCases } from "@/lib/repositories/cases";
import type { DuplicateCandidate, SourceRecord } from "@/lib/types";

const MAX_ROWS = 1_000;
const MAX_CONTENT_BYTES = 20 * 1024 * 1024;

const requestSchema = z.object({
  format: z.enum(["json", "csv"]),
  content: z.string().min(2).max(MAX_CONTENT_BYTES),
  retryJobId: z.string().min(1).max(100).optional(),
});

const rowSchema = z.object({
  title: z.string().min(2).max(300),
  organization: z.string().min(1).max(200),
  sourceUrl: z.string().max(2_000).optional().default(""),
  sourceTitle: z.string().max(300).optional().default(""),
  sourceType: z.enum(["government", "company", "implementer", "disclosure", "institution", "media", "reprint"]).optional().default("media"),
  publisher: z.string().max(200).optional().default(""),
  externalId: z.string().max(200).optional().default(""),
  publishedAt: z.string().max(50).optional().default(""),
  scenario: z.string().max(100).optional().default(""),
  department: z.string().max(100).optional().default(""),
  implementer: z.string().max(200).optional().default(""),
  solution: z.string().max(5_000).optional().default(""),
  result: z.string().max(2_000).optional().default(""),
  rawText: z.string().max(100_000).optional().default(""),
  originalRowNumber: z.coerce.number().int().min(1).max(MAX_ROWS).optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

function remapStandardColumns(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const row = value as Record<string, unknown>;
  return {
    title: row.title ?? row.case_title,
    organization: row.organization ?? row.organization_name,
    sourceUrl: row.sourceUrl ?? row.source_url,
    sourceTitle: row.sourceTitle ?? row.source_title,
    sourceType: row.sourceType ?? row.source_type,
    publisher: row.publisher,
    externalId: row.externalId ?? row.external_id,
    publishedAt: row.publishedAt ?? row.published_at,
    scenario: row.scenario ?? row.primary_scenario,
    department: row.department ?? row.business_function ?? row.business_functions,
    implementer: row.implementer,
    solution: row.solution,
    result: row.result ?? row.result_text,
    rawText: row.rawText ?? row.raw_text ?? row.source_excerpt,
    originalRowNumber: row.originalRowNumber ?? row.original_row_number ?? row.row_number ?? row.row,
  };
}

function validateRawRows(raw: unknown[]) {
  if (raw.length > MAX_ROWS) throw new Error("TOO_MANY_ROWS");
  return raw.map((value, index) => ({ index: index + 1, raw: value, parsed: rowSchema.safeParse(remapStandardColumns(value)) }));
}

function parseRows(format: "json" | "csv", content: string) {
  const decoded = format === "json" ? JSON.parse(content) : parse(content, { columns: true, skip_empty_lines: true, bom: true, trim: true });
  const raw: unknown[] = format === "json" ? (Array.isArray(decoded) ? decoded : [decoded]) : decoded;
  return validateRawRows(raw);
}

async function parseXlsx(file: File) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("EMPTY_WORKBOOK");
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map((value) => String(value ?? "").trim());
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (row.values as unknown[]).slice(1);
    if (values.every((value) => value === null || value === undefined || String(value).trim() === "")) return;
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] instanceof Date ? (values[index] as Date).toISOString() : values[index]])));
  });
  return validateRawRows(rows);
}

async function readImportRequest(request: Request) {
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_CONTENT_BYTES) throw new Error("INVALID_FILE");
    const name = file.name.toLowerCase();
    const retryJobId = typeof form.get("retryJobId") === "string" && String(form.get("retryJobId")).trim() ? String(form.get("retryJobId")).trim() : undefined;
    if (name.endsWith(".xlsx")) return { format: "xlsx" as const, rows: await parseXlsx(file), retryJobId };
    const content = await file.text();
    if (name.endsWith(".csv")) return { format: "csv" as const, rows: parseRows("csv", content), retryJobId };
    if (name.endsWith(".json")) return { format: "json" as const, rows: parseRows("json", content), retryJobId };
    throw new Error("UNSUPPORTED_FILE");
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new Error("INVALID_CONTENT");
  return { format: parsed.data.format, rows: parseRows(parsed.data.format, parsed.data.content), retryJobId: parsed.data.retryJobId };
}

function exactSourceFilter(identity: ReturnType<typeof sourceIdentity>, row: ParsedRow): Record<string, unknown> {
  const alternatives: Record<string, unknown>[] = [];
  if (identity.normalizedUrl) alternatives.push({ normalizedUrl: identity.normalizedUrl });
  if (identity.externalId && row.publisher) alternatives.push({ publisher: row.publisher.trim(), externalId: identity.externalId });
  alternatives.push({ contentHash: identity.contentHash });
  return { $or: alternatives };
}

function asCaseSource(source: SourceRecord) {
  return {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    type: source.type,
    url: source.originalUrl,
    publishedAt: source.publishedAt,
    collectedAt: source.collectedAt,
    accessibility: source.accessibility,
    supports: source.supports,
  };
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let parsedRows: ReturnType<typeof parseRows>;
  let importFormat: "json" | "csv" | "xlsx";
  let retryJobId: string | undefined;
  try {
    const imported = await readImportRequest(request);
    parsedRows = imported.rows;
    importFormat = imported.format;
    retryJobId = imported.retryJobId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: message === "TOO_MANY_ROWS" ? "单次最多导入 1,000 行，请拆分后重试" : message === "INVALID_FILE" ? "文件为空或超过 20 MB" : message === "UNSUPPORTED_FILE" ? "仅支持 UTF-8 CSV、XLSX 或 JSON" : "无法解析内容，请检查文件或 JSON/CSV 格式" }, { status: 400 });
  }

  const db = isDbConfigured() ? await getDb() : null;
  if (retryJobId && !db) return NextResponse.json({ error: "重试导入需要先配置 CloudBase" }, { status: 503 });
  const retryJob = retryJobId && db ? await db.collection("import_jobs").findOne({ id: retryJobId }) : null;
  if (retryJobId && !retryJob) return NextResponse.json({ error: "原导入任务不存在" }, { status: 404 });
  const existingCases = await listAdminCases(1_000);
  const jobId = retryJobId ?? nanoid(14);
  const results: Array<Record<string, unknown>> = [];
  const createdAt = new Date();
  const hasTrackedFailedRows = Array.isArray(retryJob?.failedRowNumbers);
  const retryableRows = new Set<number>((retryJob?.failedRowNumbers as unknown[] | undefined)?.map(Number).filter(Number.isInteger) ?? []);
  const attemptedRetryRows = new Set<number>();

  if (db && !retryJob) {
    await db.collection("import_jobs").insertOne({
      id: jobId,
      templateVersion: "1.0",
      format: importFormat,
      total: parsedRows.length,
      status: "parsing",
      counts: { staged: 0, duplicate: 0, review: 0, invalid: 0 },
      createdBy: session.user?.email,
      createdAt,
      updatedAt: createdAt,
    });
  } else if (db && retryJob) {
    await db.collection("import_jobs").updateOne({ id: jobId }, { $set: { status: "retrying", updatedAt: createdAt }, $inc: { retryCount: 1 } });
  }

  for (const entry of parsedRows) {
    const remappedRaw = remapStandardColumns(entry.raw) as Record<string, unknown>;
    const requestedRowNumber = Number(remappedRaw.originalRowNumber);
    const rowNumber = Number.isInteger(requestedRowNumber) && requestedRowNumber > 0 ? requestedRowNumber : entry.index;
    if (retryJob && hasTrackedFailedRows && !retryableRows.has(rowNumber)) {
      results.push({ row: rowNumber, status: "retry_rejected", error: "该行不在原任务失败清单中，已拒绝重复处理" });
      continue;
    }
    if (retryJob) attemptedRetryRows.add(rowNumber);
    if (db) {
      await db.collection("raw_import_records").insertOne({
        id: nanoid(18),
        jobId,
        rowNumber,
        payload: entry.raw,
        retry: Boolean(retryJob),
        attempt: retryJob ? Number(retryJob.retryCount ?? 0) + 1 : 1,
        createdAt: new Date(),
      });
    }

    if (!entry.parsed.success) {
      results.push({ row: rowNumber, status: "invalid", error: entry.parsed.error.issues[0]?.message });
      continue;
    }

    const row = entry.parsed.data;
    const identity = sourceIdentity(row);
    const raw = row.rawText || [row.title, row.organization, row.sourceTitle, row.solution, row.result].join("\n");

    if (db) {
      const exact = await db.collection<SourceRecord>("sources").findOne(exactSourceFilter(identity, row), { projection: { _id: 0 } });
      if (exact) {
        await Promise.all([
          db.collection("sources").updateOne({ id: exact.id }, { $set: { lastCollectedAt: new Date().toISOString(), accessibility: "available" }, $inc: { seenCount: 1 } }),
          db.collection("import_rows").updateOne(
            { idempotencyKey: identity.idempotencyKey },
            { $set: { lastSeenAt: new Date(), lastJobId: jobId, lastRowNumber: rowNumber, sourceId: exact.id }, $inc: { seenCount: 1 }, $setOnInsert: { id: nanoid(16), jobId, rowNumber, status: "exact_duplicate", createdAt: new Date() } },
            { upsert: true },
          ),
        ]);
        results.push({ row: rowNumber, title: row.title, status: "exact_duplicate", sourceId: exact.id, message: "相同 URL、外部编号或正文哈希已存在；采集记录已更新，未重复插入" });
        continue;
      }
    }

    const dedupVector = createDedupVector(`${row.title}\n${row.solution}\n${row.result}\n${raw}`);
    const vectorMatches = db ? await findVectorSimilarCases(dedupVector, 30) : [];
    const vectorScores = new Map(vectorMatches.map((match) => [match.item.id, match.score]));
    const candidateCases = [...new Map([...existingCases, ...vectorMatches.map((match) => match.item)].map((item) => [item.id, item])).values()];
    const candidates = candidateCases
      .map((item) => ({ item, scores: scoreDuplicate(row, item, vectorScores.get(item.id) ?? 0) }))
      .sort((a, b) => b.scores.overall - a.scores.overall);
    const best = candidates[0];
    const level = duplicateLevel(best?.scores.overall ?? 0);
    const importRowId = nanoid(16);
    const sourceId = nanoid(16);
    const status = level === "high" ? "blocked_duplicate" : level === "medium" ? "needs_duplicate_review" : "staged";
    const now = new Date().toISOString();
    const source: SourceRecord = {
      id: sourceId,
      title: row.sourceTitle || row.title,
      publisher: row.publisher || row.organization,
      type: row.sourceType,
      originalUrl: row.sourceUrl || undefined,
      normalizedUrl: identity.normalizedUrl || undefined,
      externalId: identity.externalId || undefined,
      contentHash: identity.contentHash,
      publishedAt: row.publishedAt || undefined,
      collectedAt: now,
      lastCollectedAt: now,
      accessibility: "available",
      supports: [],
      caseIds: [],
    };
    const document = {
      id: importRowId,
      jobId,
      rowNumber,
      originKey: `${jobId}:${rowNumber}`,
      ...row,
      sourceId,
      normalizedUrl: identity.normalizedUrl,
      contentHash: identity.contentHash,
      idempotencyKey: identity.idempotencyKey,
      organizationNormalized: normalizeOrganization(row.organization),
      normalizedText: normalizeContent(raw),
      dedupVector,
      status,
      extractionStatus: "pending",
      createdAt: new Date(),
      lastSeenAt: new Date(),
      seenCount: 1,
    };

    if (db) {
      try {
        await db.collection<SourceRecord>("sources").insertOne(source);
        await db.collection("import_rows").insertOne(document);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          const raced = await db.collection<SourceRecord>("sources").findOne(exactSourceFilter(identity, row), { projection: { _id: 0 } });
          results.push({ row: rowNumber, title: row.title, status: "exact_duplicate", sourceId: raced?.id, message: "并发导入命中来源唯一索引，未重复插入" });
          continue;
        }
        throw error;
      }

      if (best && level !== "low") {
        const candidate: DuplicateCandidate & { importRowId: string; sourceId: string; ruleVersion: string } = {
          id: nanoid(16),
          importRowId,
          sourceId,
          incomingTitle: row.title,
          incomingOrganization: row.organization,
          existingCaseId: best.item.id,
          existingCaseTitle: best.item.title,
          scores: best.scores,
          status: "pending",
          ruleVersion: "dedup-v1.1",
          createdAt: now,
        };
        await db.collection("duplicate_candidates").insertOne(candidate);
      }
    }

    results.push({
      row: rowNumber,
      title: row.title,
      status,
      level,
      score: best?.scores.overall ?? 0,
      candidate: best ? { id: best.item.id, title: best.item.title, organization: best.item.organization.name } : null,
      source: asCaseSource(source),
    });
  }

  const counts = results.reduce<Record<string, number>>((summary, item) => {
    const status = String(item.status);
    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});
  const invalidRows = results.filter((item) => item.status === "invalid").map((item) => Number(item.row)).filter(Number.isInteger);

  if (db) {
    const mergedCounts = retryJob ? { ...(retryJob.counts as Record<string, number>) } : counts;
    let remainingFailedRows = invalidRows;
    if (retryJob) {
      if (hasTrackedFailedRows) {
        const remaining = new Set(retryableRows);
        for (const rowNumber of attemptedRetryRows) remaining.delete(rowNumber);
        for (const rowNumber of invalidRows) remaining.add(rowNumber);
        remainingFailedRows = [...remaining].sort((left, right) => left - right);
        mergedCounts.invalid = remainingFailedRows.length;
      } else {
        mergedCounts.invalid = Math.max(0, Number(mergedCounts.invalid ?? 0) - attemptedRetryRows.size + Number(counts.invalid ?? 0));
      }
      for (const [status, count] of Object.entries(counts)) if (status !== "invalid") mergedCounts[status] = Number(mergedCounts[status] ?? 0) + count;
    }
    await db.collection("import_jobs").updateOne({ id: jobId }, { $set: { status: mergedCounts.invalid ? "partial" : "staged", counts: mergedCounts, failedRowNumbers: remainingFailedRows, ...(retryJob ? { lastRetryAt: new Date() } : {}), updatedAt: new Date() } });
    await writeAuditLog({ actor: session.user?.email ?? "admin", action: retryJob ? "import.retry" : "import.create", entityType: "import_job", entityId: jobId, metadata: { attemptedRows: parsedRows.length, counts, templateVersion: "1.0" } });
  }

  return NextResponse.json({ ok: true, jobId, retry: Boolean(retryJob), persisted: Boolean(db), total: parsedRows.length, counts, results });
}
