import { NextResponse } from "next/server";
import { MongoServerError } from "@/lib/db/cloudbase";
import { z } from "zod";
import { caseInputSchema, publicationIssues } from "@/app/api/admin/cases/route";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getIndustry, getScenario } from "@/lib/catalog";
import { createDedupVector, sourceIdentity } from "@/lib/dedup";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import type { CaseStudy } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "请先配置 CloudBase" }, { status: 503 });
  const id = (await params).id;
  const parsed = caseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "案例字段不完整", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const issues = publicationIssues(parsed.data);
  if (issues.length) return NextResponse.json({ error: "发布检查未通过", issues }, { status: 422 });
  const industry = getIndustry(parsed.data.industry);
  const scenario = getScenario(parsed.data.scenario);
  if (!industry || !scenario) return NextResponse.json({ error: "行业或场景无效" }, { status: 400 });

  const db = await getDb();
  const collection = db.collection<CaseStudy>("cases");
  const before = await collection.findOne({ id }, { projection: { _id: 0 } });
  if (!before) return NextResponse.json({ error: "案例不存在" }, { status: 404 });
  const value = parsed.data;
  const expectedVersion = value.version ?? before.version ?? 1;
  const nextVersion = expectedVersion + 1;
  const updatedAt = new Date().toISOString();
  const sourceId = before.sources[0]?.id ?? `source-${id}`;
  const results = value.results.length ? value.results : [{ label: "项目效果", value: "未披露", kind: "undisclosed" as const }];
  const set: Partial<CaseStudy> = {
    version: nextVersion,
    slug: value.slug || before.slug,
    title: value.title,
    organization: { ...before.organization, name: value.organization, size: value.organizationSize },
    industry,
    scenarios: [scenario],
    businessFunctions: [value.businessFunction],
    summary: value.summary,
    background: value.background,
    problem: value.problem,
    solution: value.solution,
    implementationSteps: value.implementationSteps,
    duration: value.duration,
    cost: value.cost,
    roi: value.roi,
    results: results.map((result) => ({ ...result, sourceId: result.kind === "undisclosed" ? undefined : sourceId })),
    risks: value.risks,
    failureReason: value.failureReason || undefined,
    outcomeStatus: value.outcomeStatus,
    confidence: value.confidence,
    contentStatus: value.contentStatus,
    editorComment: { ...before.editorComment, priority: value.outcomeStatus === "failure" ? "暂不建议" : before.editorComment.priority, text: value.editorComment, suitableFor: value.suitableFor, prerequisites: value.prerequisites },
    sources: [{ ...(before.sources[0] ?? { id: sourceId, type: "media", collectedAt: updatedAt, accessibility: "available" }), title: value.sourceTitle, publisher: value.sourcePublisher, url: value.sourceUrl || undefined, publishedAt: value.sourcePublishedAt || undefined, supports: value.sourceSupports }],
    dedupVector: createDedupVector(`${value.title}\n${value.problem}\n${value.solution}\n${results.map((result) => result.value).join("\n")}`),
    updatedAt,
    publishedAt: value.contentStatus === "published" ? (before.publishedAt || updatedAt) : before.publishedAt,
    implementationYear: value.implementationYear,
    painPointTags: value.painPointTags ?? [],
    highlight: value.highlight,
    ctaText: value.ctaText,
    techPath: value.techPath ?? [],
    modelStack: value.modelStack ?? [],
    implementers: value.implementers ?? before.implementers,
    investmentRange: value.investmentRange,
    projectDuration: value.projectDuration,
    testimonial: value.testimonial ?? null,
  };

  await db.collection("case_versions").updateOne(
    { caseId: id, version: before.version ?? 1 },
    { $setOnInsert: { snapshot: before, createdBy: session.user?.email, createdAt: new Date() } },
    { upsert: true },
  );

  try {
    const versionFilter = before.version === undefined ? { id, $or: [{ version: expectedVersion }, { version: { $exists: false } }] } : { id, version: expectedVersion };
    const result = await collection.updateOne(versionFilter, { $set: set });
    if (result.matchedCount === 0) return NextResponse.json({ error: "案例已被其他会话修改，请刷新后查看差异再保存", code: "VERSION_CONFLICT", expectedVersion }, { status: 409 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return NextResponse.json({ error: "Slug 或来源与其他记录冲突" }, { status: 409 });
    throw error;
  }

  const after = { ...before, ...set } as CaseStudy;
  await db.collection("case_versions").updateOne(
    { caseId: id, version: nextVersion },
    { $setOnInsert: { snapshot: after, createdBy: session.user?.email, createdAt: new Date() } },
    { upsert: true },
  );
  const identity = sourceIdentity({ title: value.title, organization: value.organization, sourceUrl: value.sourceUrl, sourceTitle: value.sourceTitle, publisher: value.sourcePublisher, solution: value.solution, result: results.map((entry) => `${entry.label}:${entry.value}`).join("\n"), rawText: [value.sourceTitle, value.background, value.problem, value.solution, ...value.sourceSupports].join("\n") });
  await db.collection("sources").updateOne(
    { id: sourceId },
    { $set: { title: value.sourceTitle, publisher: value.sourcePublisher, type: "media", originalUrl: value.sourceUrl || undefined, normalizedUrl: identity.normalizedUrl || undefined, contentHash: identity.contentHash, publishedAt: value.sourcePublishedAt || undefined, lastCollectedAt: updatedAt, accessibility: "available", supports: value.sourceSupports }, $setOnInsert: { id: sourceId, collectedAt: updatedAt, caseIds: [id] } },
    { upsert: true },
  );
  await writeAuditLog({ actor: session.user?.email ?? "admin", action: value.contentStatus === "published" && before.contentStatus !== "published" ? "case.publish" : "case.update", entityType: "case", entityId: id, before: { version: before.version, contentStatus: before.contentStatus, outcomeStatus: before.outcomeStatus }, after: { version: nextVersion, contentStatus: set.contentStatus, outcomeStatus: set.outcomeStatus } });
  return NextResponse.json({ ok: true, id, slug: set.slug, version: nextVersion });
}

export async function DELETE(_: Request, { params }: { params: Params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "请先配置 CloudBase" }, { status: 503 });
  const id = z.string().min(1).parse((await params).id);
  const db = await getDb();
  const before = await db.collection<CaseStudy>("cases").findOne({ id }, { projection: { _id: 0 } });
  if (!before) return NextResponse.json({ error: "案例不存在" }, { status: 404 });
  const deletedAt = new Date().toISOString();
  const nextVersion = (before.version ?? 1) + 1;
  const versionFilter = before.version === undefined ? { id, version: { $exists: false } } : { id, version: before.version };
  const result = await db.collection<CaseStudy>("cases").updateOne(versionFilter, { $set: { version: nextVersion, contentStatus: "deleted", deletedAt, updatedAt: deletedAt } });
  if (result.matchedCount === 0) return NextResponse.json({ error: "案例已被其他会话修改，请刷新后重试", code: "VERSION_CONFLICT" }, { status: 409 });
  await db.collection("case_versions").insertOne({ caseId: id, version: nextVersion, snapshot: { ...before, version: nextVersion, contentStatus: "deleted", deletedAt, updatedAt: deletedAt }, createdBy: session.user?.email, createdAt: new Date() });
  await writeAuditLog({ actor: session.user?.email ?? "admin", action: "case.delete", entityType: "case", entityId: id, before: { version: before.version, contentStatus: before.contentStatus }, after: { version: nextVersion, contentStatus: "deleted" } });
  return NextResponse.json({ ok: true });
}
