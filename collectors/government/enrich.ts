/**
 * 政府案例抽取与补采（核心）：
 *
 * 流程：抓取详情页 → AI 抽取结构化字段 → 缺失字段补采（去权威网站搜索补齐）
 *      → 编辑点评（≤100字）→ 行业/场景 top-1 判定 → 组装为 CaseStudy。
 *
 * 对应需求：
 * ② 企业痛点/业务背景/问题/方案/结果/风险与边界 缺失时，优先去权威网站搜索补齐，不权威的不要。
 * ③ 编辑点评由 AI 生成，≤100 字。
 * ④ 案例归入最合适的 1 个行业 + 1 个场景（来自 src/lib/catalog 清单）。
 * ⑤ 年份区分发布年份(publishedAt)与实施年份(implementedAt)。
 * ⑥ 信息来源 = 网址名称 + 超链接。
 */

import { generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import dotenv from "dotenv";
import { fetchHtml, stripHtml } from "../lib/fetch";
import { industries, scenarios, getIndustry, getScenario } from "../../src/lib/catalog";
import { normalizeCase, buildDedupKey } from "../lib/normalize";
import { isAuthoritative } from "./config";
import { searchCases } from "./search";
import type { Candidate } from "./discover";

dotenv.config();

function getModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");
  return createDeepSeek({ apiKey })("deepseek-chat");
}

function siteNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url;
  }
}

/** 政府案例抽取 schema（在厂商 schema 基础上适配机关单位 + 来源名称）。 */
const govCaseSchema = z.object({
  isAICase: z.boolean().describe("是否真正使用了 AI/大模型/机器学习/计算机视觉/NLP/生成式AI/OCR/知识库问答/RPA+AI 等。仅上云、建网站、普通数据库等不算。"),
  title: z.string().describe("案例标题（官方原文或精炼改写，忠于原意）"),
  summary: z.string().describe("一句话摘要，不超过100字"),
  orgName: z.string().describe("发布/实施案例的政府机关或事业单位名称，如 '广东省工业和信息化厅'"),
  region: z.string().describe("所在省份/城市，如 '广东省' '南京市'"),
  industrySlug: z.string().describe("单个行业标识，必须从 catalog 选择"),
  scenarioSlug: z.string().describe("单个业务场景标识，必须从 catalog 选择"),
  functions: z.array(z.string()).describe("业务职能：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理"),
  background: z.string().describe("业务背景，不超过300字。缺失则填空字符串。"),
  problem: z.string().describe("企业痛点/遇到的问题/挑战，不超过400字。缺失则填空字符串。"),
  solution: z.string().describe("AI 解决方案与实施路径，不超过600字。缺失则填空字符串。"),
  implementationSteps: z.array(z.string()).describe("实施步骤，最多6条"),
  results: z.array(z.string()).describe("实施结果/成效，最多6条"),
  roi: z.string().describe("价值总结，不超过100字"),
  risks: z.string().describe("风险与边界，不超过200字。缺失则填空字符串。"),
  editorComment: z.string().describe("编辑点评：基于项目理解写一句简要描述，严格不超过100字，聚焦价值与可借鉴点。"),
  modelStack: z.array(z.string()).describe("使用的 AI 模型/算法/平台，最多8条"),
  techPath: z.array(z.string()).describe("技术路线/系统，最多8条"),
  tags: z.array(z.string()).describe("标签，最多12条"),
  publishedYear: z.string().describe("发布年份（案例在官网上发布的年份），如 '2025' '2026'。无法判断填空。"),
  implementedYear: z.string().describe("项目实施年份（实际落地年份，可能早于发布年）。只给一个年份且无明确实施时间则填空，禁止编造。"),
  confidence: z.string().describe("信息完整度：high / medium / pending"),
  outcomeStatus: z.string().describe("结果：success / partial / failure / undisclosed"),
});

type GovCase = z.infer<typeof govCaseSchema>;

function buildExtractPrompt(detailText: string, candidate: Candidate): string {
  const industryOptions = industries.map((i) => `${i.slug}(${i.name})`).join(", ");
  const scenarioOptions = scenarios.map((s) => `${s.slug}(${s.name})`).join(", ");
  return `你是政府 AI 应用案例分析师。请从以下政府机关发布的案例原文中提取结构化信息。

要求：
1. 必须改写，避免原样照抄；保留核心事实。
2. 严格判断 AI 相关性：只有明确用了 AI 技术 isAICase 才为 true。
3. 字段限制：
   - industrySlug 必须从：${industryOptions} 选 **恰好一个**
   - scenarioSlug 必须从：${scenarioOptions} 选 **恰好一个**
   - functions 必须是：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理
4. 若原文缺失某字段（如痛点、风险），先填空字符串，稍后系统会去权威网站补采，不要编造。
5. 年份：publishedYear 是官网发布年；implementedYear 是实际实施年；只有一个年份时填 publishedYear、implementedYear 留空。

来源网页标题：${candidate.title}
来源 URL：${candidate.url}

原文（节选）：
${detailText.slice(0, 12000)}

直接输出 JSON。`;
}

/** 核心业务字段（补采重点）。任一为空即视为“缺失”。 */
const CORE_FIELDS: (keyof GovCase)[] = ["background", "problem", "solution", "results", "risks"];

/** 统计缺失的核心字段数量。 */
function countMissing(partial: GovCase): number {
  return CORE_FIELDS.filter((f) => {
    const v = partial[f];
    if (Array.isArray(v)) return v.length === 0;
    return !v || String(v).trim() === "";
  }).length;
}

const PENDING_PLACEHOLDER = "待人工补充";

/**
 * 补采缺失字段：用标题+机关名去权威网站搜索，抓取后让 AI 补齐。
 * 触发更克制（原文<200字 或 缺失字段≥2），避免无谓消耗配额。
 * 补采未能补齐的字段显式标注「待人工补充」，并标记 confidence=pending。
 */
async function enrichMissingFields(
  candidate: Candidate,
  partial: GovCase,
  detailText: string,
): Promise<Partial<GovCase>> {
  const missingCount = countMissing(partial);
  const shortText = (detailText || "").trim().length < 200;
  const shouldEnrich = shortText || missingCount >= 2;
  if (!shouldEnrich) {
    console.log(
      `[enrich] 字段基本完整（缺失 ${missingCount}，正文 ${detailText.trim().length} 字），跳过补采：${partial.title || candidate.title}`,
    );
    return {};
  }

  console.log(`[enrich] 缺失字段 ${missingCount} / 正文 ${detailText.trim().length} 字，去权威网站补采：${partial.title || candidate.title}`);
  const queries = [
    `${partial.orgName || candidate.province} ${partial.title || candidate.title} 人工智能 应用`,
    `${partial.title || candidate.title} 案例 实施 成效`,
  ];
  const hits = (await Promise.all(queries.map((q) => searchCases(q, 5)))).flat();
  const authoritative = hits.filter((h) => isAuthoritative(h.url) && h.url !== candidate.url).slice(0, 3);
  if (authoritative.length === 0) {
    console.log(`[enrich] 未找到权威补采来源，缺失字段标「待人工补充」：${partial.title || candidate.title}`);
    return placeholderForMissing(partial);
  }

  let supplementalText = "";
  for (const h of authoritative) {
    try {
      const res = await fetchHtml(h.url, { timeoutMs: 20000 });
      supplementalText += `\n\n来源：${h.title} (${h.url})\n${res.text.slice(0, 6000)}`;
    } catch {
      /* ignore */
    }
  }
  if (!supplementalText.trim()) return placeholderForMissing(partial);

  const fillSchema = z.object({
    background: z.string(),
    problem: z.string(),
    solution: z.string(),
    results: z.array(z.string()),
    risks: z.string(),
  });

  try {
    const { output } = await generateText({
      model: getModel(),
      prompt: `根据以下权威来源，补齐该政府 AI 案例缺失的字段。只输出 JSON。
已抽取的部分：${JSON.stringify({
        title: partial.title,
        orgName: partial.orgName,
        summary: partial.summary,
      })}

权威来源材料：
${supplementalText.slice(0, 16000)}

请补齐：background(业务背景)、problem(痛点/问题)、solution(AI方案)、results(实施结果[])、risks(风险与边界)。缺失则用空字符串/空数组，不要编造数字。`,
      output: Output.object({ schema: fillSchema }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: 3000,
      abortSignal: AbortSignal.timeout(90_000),
    });
    // 补采后仍有缺口的字段，显式标注「待人工补充」，避免与前台“无此字段”混淆
    const filled: Partial<GovCase> = { ...output };
    const stillMissing = countMissing(output as GovCase);
    if (stillMissing > 0) {
      console.log(`[enrich] 补采后仍有 ${stillMissing} 个字段缺口，标「待人工补充」：${partial.title || candidate.title}`);
      (filled as any).confidence = "pending";
      for (const f of CORE_FIELDS) {
        const v = (output as any)[f];
        const empty = Array.isArray(v) ? v.length === 0 : !v || String(v).trim() === "";
        if (empty) {
          (filled as any)[f] = Array.isArray(v) ? [] : PENDING_PLACEHOLDER;
        }
      }
    }
    return filled;
  } catch (err: any) {
    console.warn(`[enrich] 补采失败 ${candidate.url}: ${err.message || err}`);
    return placeholderForMissing(partial);
  }
}

/** 对当前仍缺失的核心字段补「待人工补充」占位，并标记 confidence=pending。 */
function placeholderForMissing(partial: GovCase): Partial<GovCase> {
  const placeholder: Partial<GovCase> = { confidence: "pending" };
  for (const f of CORE_FIELDS) {
    const v = partial[f];
    const empty = Array.isArray(v) ? v.length === 0 : !v || String(v).trim() === "";
    if (empty) {
      (placeholder as any)[f] = Array.isArray(v) ? [] : PENDING_PLACEHOLDER;
    }
  }
  return placeholder;
}

export interface EnrichedResult {
  caseStudy: ReturnType<typeof normalizeCase> | null;
  skipped: boolean;
  reason?: string;
}

export async function enrichCandidate(candidate: Candidate): Promise<EnrichedResult> {
  // 1) 抓取详情
  let detailText = "";
  try {
    const res = await fetchHtml(candidate.url, { timeoutMs: 25000 });
    detailText = res.text || stripHtml(res.html);
  } catch (err: any) {
    return { caseStudy: null, skipped: true, reason: `抓取失败: ${err.message || err}` };
  }
  if (!detailText.trim()) {
    return { caseStudy: null, skipped: true, reason: "详情页无文本" };
  }

  // 2) AI 抽取
  let extracted: GovCase;
  try {
    const { output } = await generateText({
      model: getModel(),
      prompt: buildExtractPrompt(detailText, candidate),
      output: Output.object({ schema: govCaseSchema }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: 6000,
      abortSignal: AbortSignal.timeout(120_000),
    });
    extracted = output as GovCase;
  } catch (err: any) {
    return { caseStudy: null, skipped: true, reason: `抽取失败: ${err.message || err}` };
  }

  if (!extracted.isAICase) {
    return { caseStudy: null, skipped: true, reason: "非 AI 案例" };
  }

  // 3) 补采缺失字段
  const filled = await enrichMissingFields(candidate, extracted, detailText);
  extracted = { ...extracted, ...filled };

  // 4) 组装为 normalizeCase 所需的 ExtractedCase 形状
  const publishedYear = extracted.publishedYear || new Date().getFullYear().toString();
  const raw = {
    sourceUrl: candidate.url,
    companyName: extracted.orgName || candidate.province,
    title: extracted.title || candidate.title,
    rawIndustry: extracted.industrySlug,
    summary: extracted.summary,
  };
  const extractedForNormalize = {
    isAICase: true,
    aiRelevanceReason: "",
    title: extracted.title,
    summary: extracted.summary,
    industrySlug: extracted.industrySlug,
    scenarioSlugs: [extracted.scenarioSlug], // 仅 1 个场景
    functions: extracted.functions,
    background: extracted.background,
    problem: extracted.problem,
    solution: extracted.solution,
    implementationSteps: extracted.implementationSteps,
    results: extracted.results,
    roi: extracted.roi,
    risks: extracted.risks,
    editorComment: {
      suitableFor: [extracted.region || candidate.province],
      prerequisites: [],
      priority: "medium" as const,
      text: extracted.editorComment,
    },
    modelStack: extracted.modelStack,
    techPath: extracted.techPath,
    tags: extracted.tags,
    confidence: extracted.confidence,
    outcomeStatus: extracted.outcomeStatus,
    implementedAt: extracted.implementedYear || "",
  };

  const cs = normalizeCase(raw, extractedForNormalize as any, extracted.orgName || "政府机关");
  // 覆盖政府专属字段
  cs.organization = {
    name: extracted.orgName || candidate.province,
    size: "未披露",
    region: extracted.region || candidate.province,
    anonymous: false,
    type: "政府机关/事业单位",
  };
  cs.industry = getIndustry(extracted.industrySlug) || cs.industry;
  cs.scenarios = [getScenario(extracted.scenarioSlug) || cs.scenarios[0]].filter(Boolean) as any;
  cs.publishedAt = publishedYear ? new Date(`${publishedYear}-01-01`).toISOString() : cs.publishedAt;
  cs.implementedAt = extracted.implementedYear ? new Date(`${extracted.implementedYear}-01-01`).toISOString() : "";
  cs.sources = [
    {
      type: "government_website",
      title: `${siteNameFromUrl(candidate.url)} - ${extracted.title || candidate.title}`,
      url: candidate.url,
    },
  ];
  cs.dedupKey = buildDedupKey(extracted.title || candidate.title, candidate.url, {
    company: (cs.organization && cs.organization.name) || "",
    summary: cs.summary || "",
    publishedYear,
  });
  cs.sourceType = "government";

  return { caseStudy: cs, skipped: false };
}
