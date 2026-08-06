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

/** 生成去重指纹：归一化标题 + 来源域名 + 发布年份。 */
export function buildDedupKey(title: string, sourceUrl: string, publishedYear?: string): string {
  const t = normalizeTitle(title);
  let host = "";
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  const year = publishedYear || "";
  return `${t}__${host}__${year}`;
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
    dedupKey: buildDedupKey(title, raw.sourceUrl, new Date(now).getFullYear().toString()),
    sourceType: "vendor",
  };
}
