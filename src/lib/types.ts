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
  sourceId?: string;
  kind: "actual" | "expected" | "estimated" | "undisclosed";
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
  implementers: string[];
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
  email?: string;
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
  roiVersions?: Array<{ version: number; investment: number; monthlyCost: number; monthlySaving: number; paybackMonths: number | null; createdAt: string }>;
  createdAt: string;
  claimedAt?: string;
  deletedAt?: string;
}

export type AssessmentJobStatus = "queued" | "processing" | "ready" | "failed" | "deleted";
export type NotificationStatus = "pending" | "sent" | "failed" | "not_configured";

export interface AssessmentJob {
  id: string;
  runId?: string;
  status: AssessmentJobStatus;
  statusTokenHash: string;
  reportTokenHash: string;
  /** 仅用于完成通知，发送成功后立即清除。 */
  reportToken?: string;
  reportId?: string;
  email: string;
  input: Record<string, unknown>;
  notificationStatus: NotificationStatus;
  notificationAttempts: number;
  errorCode?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  notifiedAt?: string;
  updatedAt: string;
  deletedAt?: string;
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
  status: "new" | "pending" | "contacted" | "completed" | "invalid" | "cancelled";
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
