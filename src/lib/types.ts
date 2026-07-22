export type OutcomeStatus = "success" | "partial" | "failure" | "undisclosed";
export type ConfidenceLevel = "high" | "medium" | "pending";
export type ContentStatus =
  | "draft"
  | "duplicate_review"
  | "in_review"
  | "published"
  | "rejected"
  | "archived"
  | "merged"
  | "deleted";

export type SourceType =
  | "government"
  | "company"
  | "implementer"
  | "disclosure"
  | "institution"
  | "media"
  | "reprint"
  | "demo";

export interface Industry {
  id: string;
  code: string;
  name: string;
  displayName: string;
  slug: string;
  description: string;
  icon: string;
  featured: boolean;
  standardVersion: string;
  parentCode?: string;
}

export interface Scenario {
  id: string;
  name: string;
  slug: string;
  description: string;
  synonyms: string[];
  icon: string;
  featured: boolean;
}

export interface CaseSource {
  id: string;
  title: string;
  publisher: string;
  type: SourceType;
  url?: string;
  publishedAt?: string;
  collectedAt: string;
  accessibility: "available" | "redirected" | "unavailable" | "restricted";
  supports: string[];
}

export interface SourceRecord extends CaseSource {
  originalUrl?: string;
  normalizedUrl?: string;
  externalId?: string;
  contentHash?: string;
  lastCollectedAt: string;
  snapshotKey?: string;
  caseIds: string[];
}

export interface CaseMetric {
  label: string;
  value: string;
  baseline?: string;
  unit?: string;
  improvement?: string;
  sourceId?: string;
  kind: "actual" | "expected" | "estimated" | "undisclosed";
}

export type ImplementationTimePrecision = "year" | "half" | "quarter" | "month" | "date";

export interface InvestmentRange {
  min?: number;
  max?: number;
  currency: "CNY" | "USD";
  disclosed: boolean;
  narrative?: string;
  sourceId?: string;
}

export interface ProjectDuration {
  minWeeks?: number;
  maxWeeks?: number;
  disclosed: boolean;
  narrative?: string;
  sourceId?: string;
}

export interface Implementer {
  name: string;
  role?: "技术提供方" | "系统集成商" | "咨询方" | "其他";
  website?: string;
}

export interface Testimonial {
  quote: string;
  author?: string;
  authorTitle?: string;
  sourceId?: string;
}

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface SourceReportRef {
  title?: string;
  publisher?: string;
  year?: number;
}

export interface CaseStudy {
  id: string;
  version: number;
  slug: string;
  title: string;
  organization: {
    id: string;
    name: string;
    size: string;
    region?: string;
    anonymous?: boolean;
    type?: "soe" | "private" | "foreign" | "sme";
  };
  industry: Industry;
  scenarios: Scenario[];
  businessFunctions: string[];
  summary: string;
  background: string;
  problem: string;
  solution: string;
  implementationSteps: string[];
  duration: string;
  cost: string;
  results: CaseMetric[];
  roi: string;
  risks: string;
  failureReason?: string;
  editorComment: {
    suitableFor: string;
    prerequisites: string;
    priority: "建议优先" | "条件具备后开展" | "暂不建议";
    text: string;
  };
  implementers: Implementer[];
  outcomeStatus: OutcomeStatus;
  contentStatus: ContentStatus;
  confidence: ConfidenceLevel;
  sources: CaseSource[];
  featured: boolean;
  views: number;
  dedupVector?: number[];
  publishedAt: string;
  updatedAt: string;
  demo?: boolean;
  mergedIntoCaseId?: string;
  mergedIntoSlug?: string;
  mergedAt?: string;
  mergedCaseIds?: string[];
  archivedAt?: string;
  implementationYear?: number;
  implementationTimePrecision?: ImplementationTimePrecision;
  painPointTags?: string[];
  painPointNarrative?: string;
  highlight?: string;
  investmentRange?: InvestmentRange;
  projectDuration?: ProjectDuration;
  testimonial?: Testimonial | null;
  techPath?: string[];
  modelStack?: string[];
  sourceReport?: SourceReportRef;
  ctaText?: string;
  consultationStats?: { consultationCount: number; viewToConsultationRate: number } | null;
  relatedCaseIds?: string[];
  tags?: string[];
  seo?: SeoMeta;
}

export interface CaseQuery {
  q?: string;
  industry?: string;
  scenario?: string;
  size?: string;
  outcome?: OutcomeStatus | "all";
  roi?: "all" | "disclosed" | "undisclosed";
  sort?: "relevance" | "latest" | "popular";
  page?: number;
  limit?: number;
  painPoint?: string;
  implementer?: string;
  model?: string;
  implementationYear?: number;
}

export interface PaginatedCases {
  items: CaseStudy[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  mode: "mongodb" | "demo";
}

export interface AssessmentAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
}

export interface AssessmentRecommendation {
  title: string;
  stage: 1 | 2 | 3;
  scenario: string;
  reason: string;
  prerequisites: string[];
  impact: "高" | "中" | "低";
  difficulty: "高" | "中" | "低";
  investment: string;
  timeline: string;
}

export interface RoiEstimate {
  initialInvestment: string;
  monthlyCost: string;
  monthlySaving: string;
  paybackPeriod: string;
  confidence: "低" | "中" | "高";
  basis: "platform-benchmark" | "ai-estimate";
  assumptions: string[];
  disclaimer: string;
}

export interface AssessmentReport {
  id: string;
  sessionId: string;
  phone?: string;
  companyProfile: string;
  diagnosis: string;
  recommendations: AssessmentRecommendation[];
  roi: RoiEstimate;
  notRecommended: string[];
  actionPlan: string[];
  relatedCaseSlugs: string[];
  markdown: string;
  aiGenerated: boolean;
  model?: string;
  promptVersion?: string;
  roiVersions?: Array<{
    version: number;
    investment: number;
    monthlyCost: number;
    monthlySaving: number;
    paybackMonths: number | null;
    anomalyFlags?: string[];
    anomaliesConfirmedAt?: string;
    createdAt: string;
  }>;
  createdAt: string;
  claimedAt?: string;
  deletedAt?: string;
}

export type AssessmentJobStatus =
  "queued" | "processing" | "ready" | "failed" | "deleted";

export interface AssessmentJob {
  id: string;
  runId?: string;
  status: AssessmentJobStatus;
  statusTokenHash: string;
  reportTokenHash: string;
  /** 用于本页查看私密报告，删除时一并清除。 */
  reportToken?: string;
  reportId?: string;
  phone: string;
  input: Record<string, unknown>;
  errorCode?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  deletedAt?: string;
  privacyNoticeVersion?: string;
  reportConsentVersion?: string;
  privacyConsentAt?: string;
  reportConsentAt?: string;
  marketingConsent?: boolean;
  marketingConsentAt?: string;
}

export interface Appointment {
  id: string;
  reportId?: string;
  name: string;
  company: string;
  role?: string;
  need: string;
  phone?: string;
  wechat?: string;
  preferredTime?: string;
  status:
    "new" | "pending" | "contacted" | "completed" | "invalid" | "cancelled";
  createdAt: string;
  note?: string;
  updatedAt?: string;
}

export interface DuplicateCandidate {
  id: string;
  incomingTitle: string;
  incomingOrganization: string;
  existingCaseId: string;
  existingCaseTitle: string;
  scores: {
    organization: number;
    semantic: number;
    scenario: number;
    function: number;
    time: number;
    implementer: number;
    metrics: number;
    overall: number;
  };
  status: "pending" | "merged" | "distinct" | "deferred" | "invalid";
  createdAt: string;
}
