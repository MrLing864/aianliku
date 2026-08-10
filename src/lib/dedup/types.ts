/**
 * 跨来源去重改造（V2.0）统一类型契约
 *
 * 来源：prd/03-案例与内容治理.md + 改造计划 V2.0。
 * 本文件只定义类型与模块接口契约，具体实现见同目录各子模块。
 *
 * 设计约束（计划九）：
 *  - 继续使用 CloudBase 文档数据库，不迁移数据库。
 *  - CloudBase 当前无语义向量检索，候选检索通过企业分组 + 结构化规则 + 词法召回实现。
 *  - 跨来源疑似重复永不自动合并，必须经过后台确认。
 *  - 原始采集记录、来源快照、来源片段、审核历史永久保留。
 *  - 保留现有案例 id / slug / views / SEO 地址不变。
 */

/* ------------------------------------------------------------------ */
/* 来源身份（source-identity）                                          */
/* ------------------------------------------------------------------ */

export type SourceAccessibility = "available" | "redirected" | "unavailable" | "restricted";

export interface SourceIdentity {
  /** 归一化 URL（去协议/www/末尾斜杠/小写） */
  normalizedUrl: string;
  normalizedUrlHash: string;
  publisherNormalized: string;
  externalId: string;
  /** 内容指纹（标题+正文关键段落 hash），用于判断同发布方内容版本 */
  contentHash: string;
}

/* ------------------------------------------------------------------ */
/* 企业主体（organizations / organization_aliases）                     */
/* ------------------------------------------------------------------ */

export type OrganizationStatus = "active" | "pending_review" | "merged";

export interface Organization {
  id: string;
  canonicalName: string;
  normalizedName: string;
  englishNames: string[];
  historicalNames: string[];
  parentOrganizationId?: string;
  officialDomain?: string;
  externalIds: {
    stockCode?: string;
    unifiedSocialCreditCode?: string;
    [k: string]: string | undefined;
  };
  status: OrganizationStatus;
  mergedIntoOrganizationId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type AliasType =
  | "简称"
  | "英文名"
  | "品牌名"
  | "历史名称"
  | "人工纠错";

export interface OrganizationAlias {
  id: string;
  organizationId: string;
  alias: string;
  normalizedAlias: string;
  aliasType: AliasType;
  sourceId?: string;
  confidence: number;
  status: "active" | "pending_review" | "rejected";
}

/* ------------------------------------------------------------------ */
/* 来源文档（sources）                                                  */
/* ------------------------------------------------------------------ */

export interface SourceDocument {
  id: string;
  originalUrl?: string;
  normalizedUrl: string;
  normalizedUrlHash: string;
  publisher: string;
  publisherNormalized: string;
  externalId?: string;
  type: string;
  title: string;
  publishedAt?: string;
  contentHash: string;
  snapshotHash?: string;
  mirrorGroupId?: string;
  lastCollectedAt: string;
  snapshotKey?: string;
  caseIds: string[];
  contentVersion: number;
  accessibility: SourceAccessibility;
  supports: string[];
  capturedRawText?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* 来源片段（source_case_segments）                                     */
/* ------------------------------------------------------------------ */

export interface SourceCaseSegment {
  id: string;
  sourceId: string;
  segmentKey: string;
  externalCaseId?: string;
  organizationMention: string;
  organizationId?: string;
  title: string;
  sectionTitle?: string;
  locator?: string;
  rawExcerpt: string;
  segmentHash: string;
  fingerprint: CaseFingerprint;
  caseId?: string;
  status: "pending" | "linked" | "distinct" | "merged";
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* 案例项目指纹（CaseFingerprint）                                      */
/* ------------------------------------------------------------------ */

export interface CaseFingerprint {
  organizationId?: string;
  projectName: string;
  primaryScenarioSlug?: string;
  businessFunctions: string[];
  businessProcess?: string;
  department?: string;
  implementationLocation?: string;
  implementationYear?: number;
  projectPhase?: string;
  implementers: string[];
  products: string[];
  solutionConcepts: string[];
  metricSignatures: string[];
  sourceKeywords: string[];
  lexicalVector: number[];
  fingerprintVersion: string;
}

/* ------------------------------------------------------------------ */
/* 重复候选（duplicate_candidates，扩展字段）                           */
/* ------------------------------------------------------------------ */

export type DuplicateRelationship =
  | "same_project"
  | "project_evolution"
  | "same_org_different_project"
  | "different_project"
  | "insufficient_evidence";

export type DuplicateResolution =
  | "supplement_existing"
  | "distinct_project"
  | "independent_case"
  | "defer"
  | "invalid_record";

export interface DuplicateCandidate {
  id: string;
  incomingTitle: string;
  incomingOrganization: string;
  existingCaseId: string;
  existingCaseTitle: string;
  /** V2 新增：关联的来源片段，而非仅 importRow */
  incomingSegmentId?: string;
  sourceId?: string;
  importRowId?: string;
  ruleScore: number;
  modelScore: number;
  verificationScore: number;
  overallScore: number;
  relationship: DuplicateRelationship;
  matchedFacts: string[];
  conflictingFacts: string[];
  missingFacts: string[];
  evidenceRefs: string[];
  recommendedAction: DuplicateResolution;
  ruleVersion: string;
  status: "pending" | "merged" | "distinct" | "deferred" | "invalid";
  resolution?: DuplicateResolution;
  resolvedBy?: string;
  resolvedAt?: string;
  note?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* 字段事实与证据（case_field_claims / content_conflicts）              */
/* ------------------------------------------------------------------ */

export interface CaseFieldClaim {
  id: string;
  caseId: string;
  sourceId: string;
  segmentId?: string;
  field: string;
  value: string;
  confidence: "verified" | "disclosed" | "estimated" | "pending";
  createdAt: string;
}

export interface ContentConflict {
  id: string;
  caseId: string;
  field: string;
  existingValue: string;
  incomingValue: string;
  sourceId: string;
  status: "open" | "resolved_existing" | "resolved_incoming";
  resolvedBy?: string;
  resolvedAt?: string;
}

/* ------------------------------------------------------------------ */
/* 案例版本（case_versions，合并/重大改写时保留快照）                   */
/* ------------------------------------------------------------------ */

export interface CaseVersion {
  id: string;
  caseId: string;
  version: number;
  snapshot: Record<string, unknown>;
  reason: string;
  createdBy: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* 原始采集记录（raw_import_records）                                   */
/* ------------------------------------------------------------------ */

export interface RawImportRecord {
  id: string;
  originKey: string;
  source: "admin_import" | "collector" | "manual" | "foreign_completion";
  jobId?: string;
  rowNumber?: number;
  attempt?: number;
  payload: Record<string, unknown>;
  normalized: {
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
  };
  status: "staged" | "deduped" | "published" | "duplicate_review" | "distinct" | "failed";
  linkedCaseId?: string;
  linkedSourceId?: string;
  linkedSegmentId?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* 去重流程统一输入/输出                                                */
/* ------------------------------------------------------------------ */

export type DedupMode = "observe" | "enforce";

export interface DedupPipelineInput {
  /** 原始采集记录或后台导入行，至少包含 normalized 字段 */
  raw: RawImportRecord;
}

export interface DedupPipelineResult {
  mode: DedupMode;
  /** 已存在则复用，新建则生成 */
  sourceId: string;
  sourceCreated: boolean;
  sourceChanged: boolean;
  segments: SourceCaseSegment[];
  /** 每个片段的判定结果 */
  decisions: SegmentDecision[];
  /** 是否进入重复审核队列（任一片段高/中疑似） */
  needsReview: boolean;
  createdCaseId?: string;
  ruleVersion: string;
}

export interface SegmentDecision {
  segment: SourceCaseSegment;
  relationship: DuplicateRelationship;
  ruleScore: number;
  modelScore: number;
  verificationScore: number;
  overallScore: number;
  recommendedAction: DuplicateResolution;
  candidateId?: string;
  createdCaseId?: string;
  reviewReason?: "score_threshold" | "model_disagreement" | "insufficient_evidence";
}
