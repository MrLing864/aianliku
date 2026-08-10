/**
 * 统一去重入口：来源幂等 → 企业归一 → 项目指纹 → 候选检索 →
 * 规则评分 → DeepSeek 双阶段判断 → 人工审核或创建案例。
 */
import "server-only";
import { getDb } from "@/lib/db/cloudbase";
import type { CaseSource, SourceType } from "@/lib/types";
import { buildSourceIdentity, contentHash } from "./source-identity";
import { resolveOrganization, type OrganizationMatchResult } from "./organization";
import { buildSegments } from "./segment";
import { candidateRetriever, type CandidateCase } from "./retrieval";
import { scoreDuplicate } from "./scoring";
import { combineScores, judgeRelationship, type ModelJudgement } from "./model";
import type {
  DedupMode,
  DedupPipelineResult,
  DuplicateCandidate,
  RawImportRecord,
  SegmentDecision,
  SourceCaseSegment,
  SourceDocument,
  SourceIdentity,
} from "./types";
import { SITE } from "@/lib/seo";
import { notifyIndexNow } from "@/lib/indexnow";

const RULE_VERSION = "dedup-v2.1.0";

type Stored<T> = T & { _id?: string };

export function getDedupMode(): DedupMode {
  return process.env.DEDUP_V2_MODE === "enforce" ? "enforce" : "observe";
}

interface IngestInput {
  source: RawImportRecord["source"];
  jobId?: string;
  rowNumber?: number;
  attempt?: number;
  title: string;
  organization: string;
  sourceUrl: string;
  sourceType: string;
  publisher: string;
  externalId: string;
  publishedAt: string;
  scenario: string;
  department: string;
  implementer: string;
  solution: string;
  result: string;
  rawText: string;
  caseDraft?: Record<string, unknown>;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}_${contentHash("", value).slice(0, 24)}`;
}

function recordId<T extends { id: string }>(record: Stored<T>): string {
  return record.id || record._id || "";
}

function recordFilter<T extends { id: string }>(record: Stored<T>): Record<string, string> {
  return record.id ? { id: record.id } : { _id: record._id || "" };
}

function sourceLookup(identity: SourceIdentity): Record<string, unknown> | null {
  const alternatives: Record<string, unknown>[] = [];
  if (identity.normalizedUrl) alternatives.push({ normalizedUrl: identity.normalizedUrl });
  if (identity.publisherNormalized && identity.externalId) {
    alternatives.push({
      publisherNormalized: identity.publisherNormalized,
      externalId: identity.externalId,
    });
  }
  if (identity.publisherNormalized && identity.contentHash) {
    alternatives.push({
      publisherNormalized: identity.publisherNormalized,
      contentHash: identity.contentHash,
    });
  }
  return alternatives.length ? { $or: alternatives } : null;
}

function sourceStableKey(identity: SourceIdentity): string {
  if (identity.normalizedUrl) return `url:${identity.normalizedUrl}`;
  if (identity.publisherNormalized && identity.externalId) {
    return `external:${identity.publisherNormalized}:${identity.externalId}`;
  }
  return `content:${identity.publisherNormalized || "unknown"}:${identity.contentHash}`;
}

/** 原始记录采用稳定 originKey；相同任务重试更新同一条，来源正文变化则保留新版本。 */
export async function stageRawRecord(input: IngestInput): Promise<RawImportRecord> {
  const db = await getDb();
  const attempt = input.attempt ?? 1;
  const originKey = input.jobId && input.rowNumber
    ? `${input.source}:${input.jobId}:${input.rowNumber}:${attempt}`
    : `${input.source}:${input.sourceUrl || input.externalId || input.title}:${contentHash(input.title, input.rawText)}`;
  const id = stableId("rir", originKey);
  const existing = await db
    .collection<RawImportRecord>("raw_import_records")
    .findOne({ id });
  const now = new Date().toISOString();
  const rec: RawImportRecord = {
    id,
    originKey,
    source: input.source,
    jobId: input.jobId,
    rowNumber: input.rowNumber,
    attempt,
    payload: { ...input },
    normalized: {
      title: input.title.trim(),
      organization: input.organization.trim(),
      sourceUrl: input.sourceUrl.trim(),
      sourceType: input.sourceType.trim(),
      publisher: input.publisher.trim(),
      externalId: input.externalId.trim(),
      publishedAt: input.publishedAt.trim(),
      scenario: input.scenario.trim(),
      department: input.department.trim(),
      implementer: input.implementer.trim(),
      solution: input.solution.trim(),
      result: input.result.trim(),
      rawText: input.rawText.trim(),
    },
    status: "staged",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.collection("raw_import_records").replaceOne({ id }, rec, { upsert: true });
  return rec;
}

async function upsertSource(
  input: IngestInput,
): Promise<{ source: SourceDocument; created: boolean; changed: boolean }> {
  const db = await getDb();
  const identity = buildSourceIdentity({
    sourceUrl: input.sourceUrl,
    publisher: input.publisher,
    externalId: input.externalId,
    title: input.title,
    rawText: input.rawText,
  });
  const coll = db.collection<Stored<SourceDocument>>("sources");
  const lookup = sourceLookup(identity);
  const existing = lookup ? await coll.findOne(lookup) : null;
  const now = new Date().toISOString();

  if (existing) {
    const id = recordId(existing);
    const changed = existing.contentHash !== identity.contentHash;
    if (changed) {
      const versionId = stableId(
        "srcv",
        `${id}:${existing.contentVersion || 1}:${existing.contentHash}`,
      );
      await db.collection("source_versions").replaceOne(
        { id: versionId },
        {
          id: versionId,
          sourceId: id,
          contentVersion: existing.contentVersion || 1,
          contentHash: existing.contentHash,
          capturedRawText: existing.capturedRawText || "",
          capturedAt: existing.updatedAt || existing.lastCollectedAt,
        },
        { upsert: true },
      );
    }
    const updates: Partial<SourceDocument> = {
      id,
      originalUrl: input.sourceUrl || existing.originalUrl,
      normalizedUrl: identity.normalizedUrl || existing.normalizedUrl,
      normalizedUrlHash: identity.normalizedUrlHash || existing.normalizedUrlHash,
      publisher: input.publisher || existing.publisher,
      publisherNormalized: identity.publisherNormalized || existing.publisherNormalized,
      externalId: identity.externalId || existing.externalId,
      type: input.sourceType || existing.type,
      title: input.title || existing.title,
      publishedAt: input.publishedAt || existing.publishedAt,
      contentHash: identity.contentHash,
      contentVersion: changed ? (existing.contentVersion || 1) + 1 : existing.contentVersion || 1,
      capturedRawText: input.rawText || existing.capturedRawText,
      lastCollectedAt: now,
      updatedAt: now,
    };
    await coll.updateOne(recordFilter(existing), { $set: updates });
    return {
      source: { ...existing, ...updates, id } as SourceDocument,
      created: false,
      changed,
    };
  }

  const id = stableId("src", sourceStableKey(identity));
  const mirror = await coll.findOne({
    contentHash: identity.contentHash,
    publisherNormalized: { $ne: identity.publisherNormalized },
  });
  const mirrorGroupId = mirror
    ? mirror.mirrorGroupId || stableId("mirror", identity.contentHash)
    : undefined;
  if (mirror && !mirror.mirrorGroupId) {
    await coll.updateOne(recordFilter(mirror), { $set: { mirrorGroupId } });
  }
  const doc: SourceDocument = {
    id,
    originalUrl: input.sourceUrl || undefined,
    normalizedUrl: identity.normalizedUrl,
    normalizedUrlHash: identity.normalizedUrlHash,
    publisher: input.publisher,
    publisherNormalized: identity.publisherNormalized,
    externalId: identity.externalId || undefined,
    type: input.sourceType,
    title: input.title,
    publishedAt: input.publishedAt || undefined,
    contentHash: identity.contentHash,
    mirrorGroupId,
    lastCollectedAt: now,
    caseIds: [],
    contentVersion: 1,
    accessibility: "available",
    supports: [],
    capturedRawText: input.rawText,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await coll.replaceOne({ _id: id }, doc, { upsert: true });
    return { source: doc, created: true, changed: true };
  } catch (error) {
    const raced = lookup ? await coll.findOne(lookup) : await coll.findOne({ id });
    if (!raced) throw error;
    return { source: { ...raced, id: recordId(raced) }, created: false, changed: false };
  }
}

function requiresReview(decision: SegmentDecision): boolean {
  if (decision.segment.caseId && !decision.candidateId) return false;
  return (
    decision.overallScore >= 0.75 ||
    decision.relationship === "same_project" ||
    decision.relationship === "project_evolution" ||
    decision.relationship === "insufficient_evidence"
  );
}

function candidateShouldBeStored(
  judgement: ModelJudgement,
  overallScore: number,
): boolean {
  return (
    overallScore >= 0.75 ||
    judgement.relationship === "same_project" ||
    judgement.relationship === "project_evolution" ||
    judgement.relationship === "insufficient_evidence"
  );
}

async function storeCandidate(
  segment: SourceCaseSegment,
  candidateCase: CandidateCase,
  ruleScore: number,
  overallScore: number,
  judgement: ModelJudgement,
): Promise<string> {
  const db = await getDb();
  const id = stableId(
    "dc",
    `${segment.id}:${candidateCase.id}:${RULE_VERSION}`,
  );
  const coll = db.collection<DuplicateCandidate>("duplicate_candidates");
  const existing = await coll.findOne({ id });
  if (existing && existing.status !== "pending") return id;
  const document: DuplicateCandidate = {
    id,
    incomingTitle: segment.title,
    incomingOrganization: segment.organizationMention,
    existingCaseId: candidateCase.id,
    existingCaseTitle: candidateCase.title,
    incomingSegmentId: segment.id,
    sourceId: segment.sourceId,
    ruleScore,
    modelScore: judgement.modelScore,
    verificationScore: judgement.verificationScore,
    overallScore,
    relationship: judgement.relationship,
    matchedFacts: judgement.matchedFacts,
    conflictingFacts: judgement.conflictingFacts,
    missingFacts: judgement.missingFacts,
    evidenceRefs: judgement.evidenceRefs,
    recommendedAction: judgement.recommendedAction,
    ruleVersion: RULE_VERSION,
    status: "pending",
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  await coll.replaceOne({ id }, document, { upsert: true });
  return id;
}

interface ScoredCandidate {
  candidateCase: CandidateCase;
  judgement: ModelJudgement;
  ruleScore: number;
  overallScore: number;
}

async function decideSegment(segment: SourceCaseSegment): Promise<SegmentDecision> {
  if (segment.caseId) {
    return {
      segment,
      relationship: "same_project",
      ruleScore: 1,
      modelScore: 1,
      verificationScore: 1,
      overallScore: 1,
      recommendedAction: "supplement_existing",
    };
  }

  const candidates = await candidateRetriever.retrieve(
    segment.fingerprint,
    segment.organizationId,
  );
  const plausibleCandidates = candidates
    .filter((candidate) => candidate.lexicalScore >= 0.18)
    .slice(0, 5);
  if (!plausibleCandidates.length) {
    return {
      segment,
      relationship: "different_project",
      ruleScore: 0,
      modelScore: 0,
      verificationScore: 0,
      overallScore: 0,
      recommendedAction: "independent_case",
    };
  }

  const scored = await Promise.all(
    plausibleCandidates.map(async (candidateCase): Promise<ScoredCandidate> => {
      const { score: ruleScore } = scoreDuplicate({
        incoming: segment.fingerprint,
        existing: candidateCase.fingerprint,
        hasOrgRelation: false,
        hasExplicitConflict: false,
      });
      const judgement = await judgeRelationship({
        incomingTitle: segment.title,
        incomingFingerprint: segment.fingerprint,
        existingTitle: candidateCase.title,
        existingFingerprint: candidateCase.fingerprint,
        incomingExcerpt: segment.rawExcerpt,
        existingExcerpt: candidateCase.excerpt,
      });
      return {
        candidateCase,
        judgement,
        ruleScore,
        overallScore: combineScores(ruleScore, judgement),
      };
    }),
  );
  scored.sort((left, right) => right.overallScore - left.overallScore);
  const best = scored[0];

  const storedIds = new Map<string, string>();
  for (const item of scored.slice(0, 3)) {
    if (!candidateShouldBeStored(item.judgement, item.overallScore)) continue;
    storedIds.set(
      item.candidateCase.id,
      await storeCandidate(
        segment,
        item.candidateCase,
        item.ruleScore,
        item.overallScore,
        item.judgement,
      ),
    );
  }

  return {
    segment,
    relationship: best.judgement.relationship,
    ruleScore: best.ruleScore,
    modelScore: best.judgement.modelScore,
    verificationScore: best.judgement.verificationScore,
    overallScore: best.overallScore,
    recommendedAction: best.judgement.recommendedAction,
    candidateId: storedIds.get(best.candidateCase.id),
    reviewReason: !best.judgement.consistent
      ? "model_disagreement"
      : best.judgement.relationship === "insufficient_evidence"
        ? "insufficient_evidence"
        : best.overallScore >= 0.75
          ? "score_threshold"
          : undefined,
  };
}

async function hydrateSegment(segment: SourceCaseSegment): Promise<SourceCaseSegment> {
  const db = await getDb();
  const existing = await db.collection<Stored<SourceCaseSegment>>("source_case_segments").findOne({
    sourceId: segment.sourceId,
    segmentKey: segment.segmentKey,
  });
  if (!existing) return segment;
  return {
    ...segment,
    id: recordId(existing),
    caseId: existing.caseId,
    status: existing.caseId ? "linked" : segment.status,
    createdAt: existing.createdAt,
  };
}

function normalizeSourceType(value: string): SourceType {
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
  return allowed.includes(value as SourceType) ? (value as SourceType) : "media";
}

function asCaseSource(source: SourceDocument): CaseSource {
  return {
    id: source.id,
    title: source.title,
    publisher: source.publisher || "未披露",
    type: normalizeSourceType(source.type),
    url: source.originalUrl,
    publishedAt: source.publishedAt,
    collectedAt: source.lastCollectedAt,
    accessibility: source.accessibility,
    supports: source.supports?.length ? source.supports : ["案例事实来源"],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function publishCaseDraft(
  raw: RawImportRecord,
  source: SourceDocument,
  organization: OrganizationMatchResult,
  mode: DedupMode | "reviewed_distinct",
): Promise<{ caseId?: string; created: boolean }> {
  const draft = raw.payload.caseDraft;
  if (!isRecord(draft)) return { created: false };
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const requestedSlug = typeof draft.slug === "string" ? draft.slug.trim() : "";
  if (!title || !requestedSlug) return { created: false };

  const db = await getDb();
  const cases = db.collection<Record<string, unknown>>("cases");
  const requestedId =
    (typeof draft.id === "string" && draft.id.trim()) || requestedSlug || stableId("case", title);
  const existing = await cases.findOne({ id: requestedId });
  if (existing && mode === "enforce") return { created: false };
  const collisionSuffix = source.id.slice(-8);
  const caseId = existing && mode === "reviewed_distinct"
    ? `${requestedId}-${collisionSuffix}`
    : existing && typeof existing.id === "string"
      ? existing.id
      : requestedId;
  const slug = existing && mode === "reviewed_distinct"
    ? `${requestedSlug}-${collisionSuffix}`
    : requestedSlug;

  const existingSources = Array.isArray(draft.sources)
    ? draft.sources.filter(isRecord)
    : [];
  const canonicalSource = asCaseSource(source) as unknown as Record<string, unknown>;
  const sources = [
    ...existingSources.filter((item) => item.id !== source.id),
    canonicalSource,
  ];
  const draftOrganization = isRecord(draft.organization) ? draft.organization : {};
  const now = new Date().toISOString();
  const document: Record<string, unknown> = {
    ...draft,
    id: caseId,
    slug,
    organization: {
      ...draftOrganization,
      id: organization.organizationId || draftOrganization.id || stableId("org", String(draftOrganization.name || "unknown")),
    },
    sources,
    views: existing && typeof existing.views === "number" ? existing.views : draft.views || 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  if (existing) {
    await cases.updateOne({ id: caseId }, { $set: document });
    return { caseId, created: false };
  }
  await cases.replaceOne({ _id: caseId }, document, { upsert: true });
  // 主动通知搜索引擎/AI 搜索平台发现新案例（失败不影响发布）
  void notifyIndexNow([`${SITE.url}/cases/${caseId}`]);
  return { caseId, created: true };
}

/** 管理员确认“不同项目/独立案例”后，恢复被 enforce 模式拦住的完整采集案例。 */
export async function publishReviewedCase(candidateId: string): Promise<string | undefined> {
  const db = await getDb();
  const candidate = await db
    .collection<DuplicateCandidate>("duplicate_candidates")
    .findOne({ id: candidateId });
  if (!candidate?.sourceId || !candidate.incomingSegmentId) return undefined;
  const [source, segment, raw] = await Promise.all([
    db.collection<Stored<SourceDocument>>("sources").findOne({ id: candidate.sourceId }),
    db.collection<Stored<SourceCaseSegment>>("source_case_segments").findOne({
      id: candidate.incomingSegmentId,
    }),
    db.collection<RawImportRecord>("raw_import_records").findOne({
      linkedSegmentId: candidate.incomingSegmentId,
    }),
  ]);
  if (!source || !segment || !raw) return undefined;
  const normalizedSource: SourceDocument = { ...source, id: recordId(source) };
  const published = await publishCaseDraft(
    raw,
    normalizedSource,
    {
      organizationId: segment.organizationId,
      needsReview: false,
      created: false,
      reason: "admin_reviewed",
    },
    "reviewed_distinct",
  );
  if (!published.caseId) return undefined;

  void notifyIndexNow([`${SITE.url}/cases/${published.caseId}`]);

  await Promise.all([
    db.collection("sources").updateOne(
      { id: normalizedSource.id },
      { $addToSet: { caseIds: published.caseId } },
    ),
    db.collection("source_case_segments").updateOne(
      { id: segment.id },
      { $set: { caseId: published.caseId, status: "linked", updatedAt: new Date().toISOString() } },
    ),
    db.collection("raw_import_records").updateOne(
      { id: raw.id },
      { $set: { linkedCaseId: published.caseId, status: "published", updatedAt: new Date().toISOString() } },
    ),
  ]);
  return published.caseId;
}

export async function runDedupPipeline(raw: RawImportRecord): Promise<DedupPipelineResult> {
  const mode = getDedupMode();
  const db = await getDb();
  const normalized = raw.normalized;
  const ingest: IngestInput = {
    source: raw.source,
    jobId: raw.jobId,
    rowNumber: raw.rowNumber,
    attempt: raw.attempt,
    title: normalized.title,
    organization: normalized.organization,
    sourceUrl: normalized.sourceUrl,
    sourceType: normalized.sourceType,
    publisher: normalized.publisher,
    externalId: normalized.externalId,
    publishedAt: normalized.publishedAt,
    scenario: normalized.scenario,
    department: normalized.department,
    implementer: normalized.implementer,
    solution: normalized.solution,
    result: normalized.result,
    rawText: normalized.rawText,
    caseDraft: isRecord(raw.payload.caseDraft) ? raw.payload.caseDraft : undefined,
  };
  const { source, created, changed } = await upsertSource(ingest);

  if (!created && !changed && source.caseIds?.length) {
    await db.collection("raw_import_records").updateOne(
      { id: raw.id },
      {
        $set: {
          status: "deduped",
          linkedSourceId: source.id,
          linkedCaseId: source.caseIds[0],
          updatedAt: new Date().toISOString(),
        },
      },
    );
    return {
      mode,
      sourceId: source.id,
      sourceCreated: false,
      sourceChanged: false,
      segments: [],
      decisions: [],
      needsReview: false,
      ruleVersion: RULE_VERSION,
    };
  }

  const organization = await resolveOrganization({ name: normalized.organization });
  const builtSegments = buildSegments({
    sourceId: source.id,
    title: normalized.title,
    rawText: normalized.rawText || normalized.solution || normalized.result,
    organizationMention: normalized.organization,
    organizationId: organization.organizationId,
    externalCaseId: normalized.externalId || undefined,
    scenario: normalized.scenario,
    department: normalized.department,
    implementer: normalized.implementer,
    solution: normalized.solution,
    result: normalized.result,
  });
  const segments = await Promise.all(builtSegments.map(hydrateSegment));
  const decisions = await Promise.all(segments.map(decideSegment));
  const needsReview = decisions.some(requiresReview);

  let createdCaseId: string | undefined;
  let linkedCaseId = segments.find((segment) => segment.caseId)?.caseId;
  if (!linkedCaseId && (!needsReview || mode === "observe")) {
    const published = await publishCaseDraft(raw, source, organization, mode);
    linkedCaseId = published.caseId;
    if (published.created) createdCaseId = published.caseId;
  }

  for (const segment of segments) {
    if (!segment.caseId && linkedCaseId) {
      segment.caseId = linkedCaseId;
      segment.status = "linked";
    } else if (!segment.caseId) {
      segment.status = needsReview ? "pending" : "distinct";
    }
    segment.updatedAt = new Date().toISOString();
    await db.collection("source_case_segments").replaceOne(
      { id: segment.id },
      segment,
      { upsert: true },
    );
  }

  const caseIds = Array.from(
    new Set([
      ...(source.caseIds || []),
      ...segments.map((segment) => segment.caseId).filter((value): value is string => Boolean(value)),
    ]),
  );
  await db.collection("sources").updateOne(
    { id: source.id },
    { $set: { caseIds, updatedAt: new Date().toISOString() } },
  );

  const finalStatus: RawImportRecord["status"] = linkedCaseId
    ? "published"
    : needsReview
      ? "duplicate_review"
      : "distinct";
  await db.collection("raw_import_records").updateOne(
    { id: raw.id },
    {
      $set: {
        status: finalStatus,
        linkedSourceId: source.id,
        linkedSegmentId: segments[0]?.id,
        linkedCaseId,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return {
    mode,
    sourceId: source.id,
    sourceCreated: created,
    sourceChanged: changed,
    segments,
    decisions,
    needsReview,
    createdCaseId,
    ruleVersion: RULE_VERSION,
  };
}
