import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getIndustry, getScenario } from "@/lib/catalog";
import { createDedupVector, sourceIdentity } from "@/lib/dedup";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import type { CaseStudy, SourceRecord } from "@/lib/types";

export const caseInputSchema = z.object({
  version: z.number().int().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120).optional(),
  title: z.string().min(4).max(200),
  organization: z.string().min(1).max(150),
  organizationSize: z.string().min(1).max(50),
  industry: z.string().min(1),
  scenario: z.string().min(1),
  businessFunction: z.string().min(1).max(50),
  summary: z.string().min(10).max(1_000),
  background: z.string().min(10).max(5_000),
  problem: z.string().min(10).max(5_000),
  solution: z.string().min(10).max(8_000),
  implementationSteps: z.array(z.string().max(500)).max(20).default([]),
  duration: z.string().max(200).default("未披露"),
  cost: z.string().max(200).default("未披露"),
  roi: z.string().max(300).default("未披露"),
  results: z.array(z.object({ label: z.string().min(1).max(100), value: z.string().min(1).max(500), kind: z.enum(["actual", "expected", "estimated", "undisclosed"]).default("undisclosed") })).max(12).default([]),
  risks: z.string().max(3_000).default("需结合企业实际数据、权限和人工复核机制评估。"),
  failureReason: z.string().max(2_000).optional().default(""),
  outcomeStatus: z.enum(["success", "partial", "failure", "undisclosed"]),
  confidence: z.enum(["high", "medium", "pending"]),
  contentStatus: z.enum(["draft", "duplicate_review", "in_review", "published", "rejected", "archived"]),
  sourceTitle: z.string().min(2).max(300),
  sourcePublisher: z.string().min(1).max(150),
  sourceUrl: z.url().optional().or(z.literal("")),
  sourcePublishedAt: z.string().max(30).optional(),
  sourceSupports: z.array(z.string().min(1).max(200)).max(20).default([]),
  editorComment: z.string().max(2_000).default("建议先核对业务基线、样本质量和人工兜底流程。"),
  suitableFor: z.string().max(500).default("业务流程相近且具备基础数据的企业"),
  prerequisites: z.string().max(500).default("明确业务负责人、样本和验收指标"),
});

export type CaseInput = z.infer<typeof caseInputSchema>;

export function publicationIssues(value: CaseInput) {
  if (value.contentStatus !== "published") return [];
  const issues: string[] = [];
  if (value.sourceSupports.length === 0) issues.push("发布前必须填写至少一条来源支持的事实");
  if (!value.sourceUrl && !value.sourcePublishedAt) issues.push("发布前必须提供原文链接或来源发布日期，便于追溯");
  if (value.results.some((result) => result.kind !== "undisclosed") && value.sourceSupports.length === 0) issues.push("效果数字必须能够关联来源证据");
  if (value.outcomeStatus === "failure") {
    if (value.failureReason.trim().length < 10) issues.push("失败案例必须填写有证据支持的失败原因");
    if (value.confidence === "pending") issues.push("待核验内容不能直接发布为失败案例");
  }
  return [...new Set(issues)];
}

function makeSlug(title: string, requested?: string) {
  if (requested) return requested;
  const digest = createHash("sha256").update(title).digest("hex").slice(0, 8);
  return `case-${digest}`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "请先配置 MongoDB 后再保存案例" }, { status: 503 });
  const parsed = caseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "案例字段不完整", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

  const value = parsed.data;
  const issues = publicationIssues(value);
  if (issues.length) return NextResponse.json({ error: "发布检查未通过", issues }, { status: 422 });
  const industry = getIndustry(value.industry);
  const scenario = getScenario(value.scenario);
  if (!industry || !scenario) return NextResponse.json({ error: "行业或场景不在受控词表中" }, { status: 400 });

  const now = new Date().toISOString();
  const id = nanoid(16);
  const sourceId = nanoid(16);
  const results = value.results.length ? value.results : [{ label: "项目效果", value: "未披露", kind: "undisclosed" as const }];
  const sourceIdentityValue = sourceIdentity({
    title: value.title,
    organization: value.organization,
    sourceUrl: value.sourceUrl,
    sourceTitle: value.sourceTitle,
    publisher: value.sourcePublisher,
    solution: value.solution,
    result: results.map((result) => `${result.label}:${result.value}`).join("\n"),
    rawText: [value.sourceTitle, value.background, value.problem, value.solution, ...value.sourceSupports].join("\n"),
  });
  const db = await getDb();
  const exactSource = await db.collection<SourceRecord>("sources").findOne({ $or: [
    ...(sourceIdentityValue.normalizedUrl ? [{ normalizedUrl: sourceIdentityValue.normalizedUrl }] : []),
    { contentHash: sourceIdentityValue.contentHash },
  ] }, { projection: { _id: 0 } });
  if (exactSource?.caseIds?.length) return NextResponse.json({ error: "该来源已经关联库内案例，请通过重复审核补充来源或确认是不同项目", code: "SOURCE_ALREADY_LINKED", caseIds: exactSource.caseIds }, { status: 409 });

  const resolvedSourceId = exactSource?.id ?? sourceId;
  const item: CaseStudy = {
    id,
    version: 1,
    slug: makeSlug(value.title, value.slug),
    title: value.title,
    organization: { id: `org-${createHash("sha256").update(value.organization.trim().toLowerCase()).digest("hex").slice(0, 12)}`, name: value.organization, size: value.organizationSize },
    industry,
    scenarios: [scenario],
    businessFunctions: [value.businessFunction],
    summary: value.summary,
    background: value.background,
    problem: value.problem,
    solution: value.solution,
    implementationSteps: value.implementationSteps,
    duration: value.duration || "未披露",
    cost: value.cost || "未披露",
    results: results.map((result) => ({ ...result, sourceId: result.kind === "undisclosed" ? undefined : resolvedSourceId })),
    roi: value.roi || "未披露",
    risks: value.risks,
    failureReason: value.failureReason || undefined,
    editorComment: { suitableFor: value.suitableFor, prerequisites: value.prerequisites, priority: value.outcomeStatus === "failure" ? "暂不建议" : "条件具备后开展", text: value.editorComment },
    implementers: [],
    outcomeStatus: value.outcomeStatus,
    contentStatus: value.contentStatus,
    confidence: value.confidence,
    sources: [{ id: resolvedSourceId, title: value.sourceTitle, publisher: value.sourcePublisher, type: "media", url: value.sourceUrl || undefined, publishedAt: value.sourcePublishedAt || undefined, collectedAt: now, accessibility: "available", supports: value.sourceSupports }],
    featured: false,
    views: 0,
    dedupVector: createDedupVector(`${value.title}\n${value.problem}\n${value.solution}\n${results.map((result) => result.value).join("\n")}`),
    publishedAt: value.contentStatus === "published" ? now : "",
    updatedAt: now,
  };

  let sourceLinked = false;
  let caseInserted = false;
  try {
    if (!exactSource) {
      await db.collection<SourceRecord>("sources").insertOne({
        id: sourceId,
        title: value.sourceTitle,
        publisher: value.sourcePublisher,
        type: "media",
        originalUrl: value.sourceUrl || undefined,
        normalizedUrl: sourceIdentityValue.normalizedUrl || undefined,
        contentHash: sourceIdentityValue.contentHash,
        publishedAt: value.sourcePublishedAt || undefined,
        collectedAt: now,
        lastCollectedAt: now,
        accessibility: "available",
        supports: value.sourceSupports,
        caseIds: [id],
      });
      sourceLinked = true;
    } else {
      await db.collection("sources").updateOne({ id: exactSource.id }, { $addToSet: { caseIds: id }, $set: { lastCollectedAt: now } });
      sourceLinked = true;
    }
    await db.collection<CaseStudy>("cases").insertOne(item);
    caseInserted = true;
    await db.collection("case_versions").insertOne({ caseId: id, version: 1, snapshot: item, createdBy: session.user?.email, createdAt: new Date() });
  } catch (error) {
    if (caseInserted) await db.collection("cases").deleteOne({ id });
    await db.collection("case_versions").deleteMany({ caseId: id });
    if (sourceLinked) {
      if (exactSource) await db.collection<SourceRecord>("sources").updateOne({ id: exactSource.id }, { $pull: { caseIds: id } });
      else await db.collection("sources").deleteOne({ id: sourceId, caseIds: { $size: 1, $all: [id] } });
    }
    if (error instanceof MongoServerError && error.code === 11000) return NextResponse.json({ error: "案例 Slug 或来源已经存在，请进入重复审核处理" }, { status: 409 });
    throw error;
  }

  await writeAuditLog({ actor: session.user?.email ?? "admin", action: value.contentStatus === "published" ? "case.publish" : "case.create", entityType: "case", entityId: id, after: { id: item.id, version: item.version, slug: item.slug, contentStatus: item.contentStatus, outcomeStatus: item.outcomeStatus } });
  return NextResponse.json({ ok: true, id, slug: item.slug, version: item.version });
}
