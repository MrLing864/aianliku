/**
 * 采集器接入端点（计划五.3）
 *
 * 采集器不再直连 DB 写 cases，改为通过内部密钥调用本端点，
 * 由统一的 runDedupPipeline 处理来源幂等、分段、企业归一、项目匹配与重复决策。
 *
 * 鉴权：请求头 x-internal-key 必须等于 env.INTERNAL_API_KEY。
 * 失败时不向采集器返回系统级错误（唯一键冲突等由 pipeline 内部兜底）。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { isDbConfigured } from "@/lib/db/cloudbase";
import { stageRawRecord, runDedupPipeline } from "@/lib/dedup/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const collectorPayloadSchema = z
  .object({
    jobId: z.string().max(200).optional(),
    rowNumber: z.number().int().positive().optional(),
    attempt: z.number().int().positive().max(100).optional(),
    title: z.string().trim().min(2).max(300),
    organization: z.string().trim().min(1).max(200),
    sourceUrl: z.string().trim().max(2_000).default(""),
    sourceType: z.string().trim().max(80).default("web"),
    publisher: z.string().trim().max(200).default(""),
    externalId: z.string().trim().max(300).default(""),
    publishedAt: z.string().trim().max(80).default(""),
    scenario: z.string().trim().max(100).default(""),
    department: z.string().trim().max(100).default(""),
    implementer: z.string().trim().max(200).default(""),
    solution: z.string().max(20_000).default(""),
    result: z.string().max(10_000).default(""),
    rawText: z.string().max(500_000).default(""),
    caseDraft: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => Boolean(value.sourceUrl || value.externalId || value.rawText), {
    message: "至少需要来源 URL、外部编号或原始正文之一",
  });

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  if (!env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "internal_ingest_not_configured" }, { status: 503 });
  }
  const key = req.headers.get("x-internal-key");
  if (key !== env.INTERNAL_API_KEY) return unauthorized();
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = collectorPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issue: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  const body = parsed.data;

  try {
    const raw = await stageRawRecord({
      source: "collector",
      jobId: body.jobId,
      rowNumber: body.rowNumber,
      attempt: body.attempt,
      title: body.title,
      organization: body.organization,
      sourceUrl: body.sourceUrl,
      sourceType: body.sourceType,
      publisher: body.publisher,
      externalId: body.externalId,
      publishedAt: body.publishedAt,
      scenario: body.scenario,
      department: body.department,
      implementer: body.implementer,
      solution: body.solution,
      result: body.result,
      rawText: body.rawText || body.solution || body.result || "",
      caseDraft: body.caseDraft,
    });

    const result = await runDedupPipeline(raw);
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      sourceId: result.sourceId,
      sourceCreated: result.sourceCreated,
      sourceChanged: result.sourceChanged,
      needsReview: result.needsReview,
      createdCaseId: result.createdCaseId,
      segmentCount: result.segments.length,
      decisions: result.decisions.map((d) => ({
        relationship: d.relationship,
        overallScore: d.overallScore,
        recommendedAction: d.recommendedAction,
      })),
    });
  } catch (error) {
    console.error("[collector-ingest] ingest failed", error);
    return NextResponse.json({ ok: false, error: "ingest_failed" }, { status: 500 });
  }
}
