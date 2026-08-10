/**
 * 案例项目指纹（计划二.6 / 三.3）
 *
 * 为案例和来源片段生成统一结构，用于候选检索与匹配解释。
 * 不建立唯一索引；当前 CloudBase 无向量能力，lexicalVector 为轻量词法向量（词频桶）。
 *
 * 字段抽取以结构化为优先（案例对象已有字段），缺失时从文本启发式兜底。
 */
import { fnv1a } from "./source-identity";
import type { CaseFingerprint } from "./types";
import type { CaseStudy } from "@/lib/types";

export const FINGERPRINT_VERSION = "dedup-v2";

/** 常见 AI 场景关键词 → slug 映射（用于 primaryScenarioSlug） */
const SCENARIO_KEYWORDS: Record<string, string[]> = {
  "customer-service": ["客服", "智能客服", "对话", "问答机器人"],
  "quality-inspection": ["质检", "缺陷检测", "视觉检测"],
  sales: ["销售", "营销", "获客", "商机"],
  forecast: ["预测", "风控", "反欺诈", "风险预警"],
  "production-scheduling": ["供应链", "物流", "仓储", "排产"],
  "rnd-design": ["研发", "设计", "仿真"],
  "knowledge-base": ["知识库", "制度检索", "知识问答"],
  ocr: ["ocr", "文字识别", "文档识别", "自动录单"],
  quotation: ["报价", "询价"],
  workflow: ["流程自动化", "自动流转", "自动录入"],
};

const BUSINESS_FUNCTION_HINTS = ["客服", "质检", "营销", "风控", "供应链", "研发", "办公", "生产", "财务", "人事", "运维"];
const DEPARTMENT_HINTS = ["生产", "制造", "质量", "客服", "营销", "供应链", "研发", "财务", "人力", "信息", "运维"];
const METRIC_PATTERN = /([\d]+(?:\.\d+)?\s?(?:%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加))/g;

function findScenario(
  rawText: string,
  scenarios?: FingerprintInput["scenarios"],
): string | undefined {
  // 优先使用已结构化的 scenarios 字段（cases 真实字段为 scenarios 数组）
  if (Array.isArray(scenarios) && scenarios.length) {
    const first = scenarios[0];
    const s = typeof first === "string" ? first : (first?.slug || first?.name);
    if (s) return s;
  }
  for (const [slug, kws] of Object.entries(SCENARIO_KEYWORDS)) {
    if (kws.some((k) => rawText.includes(k))) return slug;
  }
  return undefined;
}

function extractList(text: string, hints: string[]): string[] {
  const found = new Set<string>();
  for (const h of hints) {
    if (text.includes(h)) found.add(h);
  }
  return Array.from(found);
}

function extractMetrics(text: string): string[] {
  const matches = text.match(METRIC_PATTERN) || [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 20);
}

/** 轻量词法向量：中文使用 2/3-gram，英文使用单词，避免整句中文成为一个 token。 */
function lexicalVector(text: string, dims = 128): number[] {
  const vec = new Array(dims).fill(0);
  const normalized = text.normalize("NFKC").toLowerCase();
  const features = new Set(
    normalized.match(/[a-z0-9][a-z0-9_-]+/g)?.filter((token) => token.length >= 2) || [],
  );
  const compactCjk = (normalized.match(/[\u3400-\u9fff]+/gu) || []).join("");
  for (const size of [2, 3]) {
    for (let index = 0; index <= compactCjk.length - size; index += 1) {
      features.add(compactCjk.slice(index, index + size));
    }
  }
  for (const feature of features) {
    const h = fnv1a(feature);
    const idx = parseInt(h, 36) % dims;
    vec[idx] += 1;
  }
  return vec;
}

export interface FingerprintInput {
  title?: string;
  rawText?: string;
  organizationId?: string;
  scenario?: string;
  scenarios?: (string | { slug?: string; name?: string })[];
  department?: string;
  implementer?: string;
  implementers?: string[];
  products?: string[];
  solution?: string;
  result?: string;
  businessFunctions?: string[];
  implementationYear?: number;
  implementationLocation?: string;
  projectPhase?: string;
}

/**
 * 从结构化字段或文本生成指纹。优先使用已结构化字段，缺失字段不臆造（保持未披露语义）。
 */
export function buildFingerprintFromText(input: FingerprintInput): CaseFingerprint {
  const text = [input.title, input.rawText, input.solution, input.result].filter(Boolean).join(" ");
  const businessFunctions = input.businessFunctions?.length
    ? input.businessFunctions
    : extractList(text, BUSINESS_FUNCTION_HINTS);
  const department = input.department || extractList(text, DEPARTMENT_HINTS)[0];
  const scenario = input.scenario || findScenario(text, input.scenarios);
  const metrics = extractMetrics(text);
  const products = input.products?.length ? input.products : [];
  const implementers = Array.from(
    new Set([...(input.implementers || []), ...(input.implementer ? [input.implementer] : [])]),
  ).filter(Boolean);

  return {
    organizationId: input.organizationId,
    projectName: input.title || "",
    primaryScenarioSlug: scenario,
    businessFunctions,
    businessProcess: undefined,
    department,
    implementationLocation: input.implementationLocation,
    implementationYear: input.implementationYear,
    projectPhase: input.projectPhase,
    implementers,
    products,
    solutionConcepts: input.solution ? input.solution.slice(0, 500).split(/[，。；;]/).map((s) => s.trim()).filter(Boolean).slice(0, 10) : [],
    metricSignatures: metrics,
    sourceKeywords: Array.from(new Set([...(scenario ? [scenario] : []), ...businessFunctions, ...(department ? [department] : [])])),
    lexicalVector: lexicalVector(text),
    fingerprintVersion: FINGERPRINT_VERSION,
  };
}

/** 由已入库 CaseStudy 对象生成指纹（保留已披露字段） */
export function fingerprintFromCase(caseObj: CaseStudy): CaseFingerprint {
  const resultText = (caseObj.results || [])
    .map((result) => `${result.label} ${result.value} ${result.improvement || ""}`)
    .join(" ");
  return buildFingerprintFromText({
    title: caseObj.title,
    rawText: [caseObj.summary, caseObj.background, caseObj.problem, caseObj.solution, resultText]
      .filter(Boolean)
      .join(" "),
    organizationId: caseObj.organization?.id,
    scenarios: caseObj.scenarios || [],
    department: caseObj.businessFunctions?.[0],
    implementers: caseObj.implementers?.map((implementer) => implementer.name),
    products: caseObj.modelStack || [],
    solution: caseObj.solution,
    result: resultText,
    businessFunctions: caseObj.businessFunctions || [],
    implementationYear: caseObj.implementationYear,
    implementationLocation: caseObj.organization?.region,
  });
}

export function emptyFingerprint(): CaseFingerprint {
  return {
    projectName: "",
    businessFunctions: [],
    implementers: [],
    products: [],
    solutionConcepts: [],
    metricSignatures: [],
    sourceKeywords: [],
    lexicalVector: [],
    fingerprintVersion: FINGERPRINT_VERSION,
  };
}

/** 词法相似度：余弦近似（仅对非零维度） */
export function lexicalSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += (a[i] || 0) * (b[i] || 0);
    na += (a[i] || 0) ** 2;
    nb += (b[i] || 0) ** 2;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
