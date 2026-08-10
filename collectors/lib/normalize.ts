import type { ExtractedCase, RawListItem } from "./extract";
import { industries, scenarios, businessFunctions, getIndustry, getScenario, type Industry, type Scenario } from "../../src/lib/catalog";

function pickCatalogIndustry(input?: string): Industry {
  if (!input) return getIndustry("other")!;
  const raw: string = input.trim().toLowerCase();
  // direct slug match
  const bySlug = getIndustry(raw);
  if (bySlug) return bySlug;
  // name/synonym inclusion
  for (const ind of industries) {
    if (raw === ind.slug.toLowerCase()) return ind;
    if (ind.name.includes(input) || input.includes(ind.name)) return ind;
    if (ind.synonyms?.some((s) => input.includes(s) || s.includes(input))) return ind;
  }
  return getIndustry("other")!;
}

function pickCatalogScenarios(inputs: string[]): Scenario[] {
  const picks: (Scenario | null)[] = inputs.map((input: string) => {
    const raw: string = input.trim().toLowerCase();
    const bySlug = getScenario(raw);
    if (bySlug) return bySlug;
    for (const s of scenarios) {
      if (raw === s.slug.toLowerCase()) return s;
      if (s.name.includes(input) || input.includes(s.name)) return s;
      if (s.synonyms?.some((syn) => input.includes(syn) || syn.includes(input))) return s;
    }
    return null;
  });
  const filtered = picks.filter((s): s is Scenario => Boolean(s));
  return filtered.length > 0 ? filtered : [getScenario("agent")!];
}

function pickFunctions(inputs: string[]): string[] {
  return inputs
    .map((i: string) => i.trim())
    .filter((i: string) => businessFunctions.includes(i));
}

export interface CaseStudy {
  version: number;
  slug: string;
  title: string;
  summary: string;
  organization: {
    name: string;
    size: string;
    region: string;
    anonymous: boolean;
    type?: string;
  };
  industry: Industry;
  scenarios: Scenario[];
  businessFunctions: string[];
  background: string;
  problem: string;
  solution: string;
  implementationSteps: string[];
  duration: string;
  cost: string;
  results: { label: string; value: string; description?: string }[];
  roi: string;
  risks: string;
  editorComment: {
    suitableFor: string[];
    prerequisites: string[];
    priority: "high" | "medium" | "low";
    text: string;
  };
  implementers: { name: string; role: string; description?: string }[];
  outcomeStatus: "success" | "partial" | "failure" | "undisclosed";
  contentStatus: "published" | "in_review";
  confidence: "high" | "medium" | "pending";
  sources: { type: string; title: string; url: string }[];
  featured: boolean;
  views: number;
  publishedAt: string;
  implementedAt: string;
  updatedAt: string;
  tags: string[];
  techPath: string[];
  modelStack: string[];
  /** 去重指纹：标题归一化 + 来源域名 + 发布年份，用于幂等入库 */
  dedupKey: string;
  /** 数据来源类型：vendor（厂商）/ government（政府机关）/ university（高等院校）/ company（企业） */
  sourceType?: "vendor" | "government" | "university" | "company";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .slice(0, 80);
}

/** 标题归一化：去空白、转小写、去除年份/噪声词，用于去重比对。 */
export function normalizeTitle(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w\u4e00-\u9fa5]/g, "")
    .replace(/(20[12]\d年?)/g, "")
    .replace(/(典型案例|应用案例|优秀案例|人工智能|ai|\d+个)/gi, "")
    .trim();
}

/**
 * 去重专用标题归一化（比 normalizeTitle 更激进，但保守保留可区分词）。
 * 目的：让 LLM 对同一案例生成的「字面不同但语义相同」标题能对齐判重，
 * 例如「玲珑轮胎智慧销服一体化协同平台」与「玲珑轮胎智慧销服一体化平台：以AI驱动数字化转型」
 * 去除套话词（平台/智慧/一体化/协同/基于/借助/驱动/转型…）后都退化为「玲珑轮胎销服」→ 判为重复。
 * 同时必须保留能区分「同来源页多案例」的词（如朗镜两案例的「构建高效」vs「云原生套件升级」），
 * 因此不去除「构建/升级/高效」等可能承载区分信息的词。
 */
const DEDUP_STOPWORDS = [
  "平台", "方案", "系统", "智慧", "一体化", "协同", "基于", "借助", "通过", "实现",
  "打造", "助力", "以", "的", "了", "ai", "数字化", "转型", "驱动", "智能",
  "一站式", "案例", "应用", "典型", "优秀", "：", ":", "—", "-", "～", "~",
];
export function normalizeDedupTitle(title: string): string {
  let t = (title || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w\u4e00-\u9fa5]/g, "")
    .replace(/(20[12]\d年?)/g, "");
  for (const w of DEDUP_STOPWORDS) {
    t = t.split(w).join("");
  }
  return t.trim();
}

/** 公司名归一化：去空白/标点/后缀（有限公司/股份/集团/有限等），用于内容级去重。 */
export function normalizeCompany(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w\u4e00-\u9fa5]/g, "")
    .replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "")
    .trim();
}

/** 简易字符串 hash（FNV-1a 变体），用于正文摘要指纹。 */
function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * 去重指纹（幂等入库主键）。
 *
 * 设计目标：同一来源页即使被 LLM 改写标题/摘要，也必须稳定判为重复；
 * 同时不能误删「同来源页的多案例」（如朗镜同页不同子案例）或「券商不同研报」（来源 URL 不同）。
 *
 * 规则：
 *  - 有来源 URL：dedupKey = 归一化URL + 去重标题(normalizeDedupTitle) + 年份。
 *    归一化URL 抗 LLM 改写且稳定；去重标题仅去套话词、保留区分词，
 *    使「玲珑轮胎…协同平台」与「玲珑轮胎…以AI驱动数字化转型」对齐为同一条，
 *    同时「朗镜构建高效…」与「朗镜云原生套件升级…」因保留区分词而不误并。
 *  - 无来源 URL（人工录入/历史缺字段）：回退为 归一化标题 + 归一化公司名 + 摘要前120字hash + 年份，
 *    避免无 URL 案例被错判重复。
 */
export function buildDedupKey(
  title: string,
  sourceUrl: string,
  opts?: { company?: string; summary?: string; publishedYear?: string }
): string {
  const year = opts?.publishedYear || "";
  const url = normalizeSourceUrl(sourceUrl);
  if (url) {
    return `${url}__${normalizeDedupTitle(title)}__${year}`;
  }
  const t = normalizeTitle(title);
  const c = normalizeCompany(opts?.company || "");
  const summary = (opts?.summary || "").replace(/\s+/g, "").slice(0, 120);
  const sHash = summary ? hashString(summary) : "";
  return `${t}__${c}__${sHash}__${year}`;
}

/**
 * 来源 URL 归一化：用于"按来源页硬去重"。
 * 同一来源详情页即使带了不同 query/锚点/首尾斜杠/大小写，也应视为同一条案例。
 * - 去 protocol（http/https 统一）
 * - 去 www. 前缀
 * - 转小写
 * - 去末尾斜杠
 * - 去 query（?...）与 fragment（#...），避免 utm/track 参数导致判不同
 */
export function normalizeSourceUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let path = decodeURIComponent(u.pathname).toLowerCase();
    path = path.replace(/\/+$/, "") || "/"; // 去末尾斜杠
    return `${host}${path}`;
  } catch {
    return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").replace(/[?#].*$/, "");
  }
}

export function normalizeCase(raw: RawListItem, extracted: ExtractedCase, vendorName = "腾讯云"): CaseStudy {
  const now = new Date().toISOString();
  const industry = pickCatalogIndustry(extracted.industrySlug);
  const scenarios = pickCatalogScenarios(extracted.scenarioSlugs);

  const title = extracted.title || raw.title || raw.companyName;
  const companyName = raw.companyName;
  const slug = slugify(`${companyName}-${title}`) || slugify(companyName) || `case-${Date.now()}`;

  const results = (extracted.results || []).map((r: string) => {
    // Try to split "label: value" or "label=value" forms
    const match = r.match(/^([^:：]+)[:：][\s]*(.+)$/);
    if (match) {
      return { label: match[1].trim(), value: match[2].trim() };
    }
    return { label: "业务效果", value: r };
  });

  return {
    version: 1,
    slug,
    id: slug,
    publicId: slug,
    title,
    summary: extracted.summary || raw.summary || "",
    organization: {
      name: companyName,
      size: "未披露",
      region: "中国",
      anonymous: false,
      type: "企业",
    },
    industry,
    scenarios,
    businessFunctions: pickFunctions(extracted.functions || []),
    background: extracted.background || "",
    problem: extracted.problem || "",
    solution: extracted.solution || "",
    implementationSteps: extracted.implementationSteps || [],
    duration: "未披露",
    cost: "未披露",
    results,
    roi: extracted.roi || "",
    risks: extracted.risks || "",
    editorComment: extracted.editorComment || {
      suitableFor: [],
      prerequisites: [],
      priority: "medium",
      text: "",
    },
    implementers: [{ name: vendorName, role: "解决方案提供方" }],
    outcomeStatus: extracted.outcomeStatus || "success",
    contentStatus: "published",
    confidence: extracted.confidence || "medium",
    sources: [{ type: "vendor_case_study", title: `${companyName} - ${vendorName}客户案例`, url: raw.sourceUrl }],
    featured: false,
    views: 0,
    publishedAt: now,
    implementedAt: extracted.implementedAt || "",
    updatedAt: now,
    tags: Array.from(new Set([...(extracted.tags || []), vendorName, raw.rawIndustry || ""])),
    techPath: extracted.techPath || [],
    modelStack: extracted.modelStack || [],
    dedupKey: buildDedupKey(title, raw.sourceUrl, {
      company: companyName,
      summary: extracted.summary || raw.summary || "",
      publishedYear: new Date(now).getFullYear().toString(),
    }),
    sourceType: "vendor",
  };
}
