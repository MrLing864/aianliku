/**
 * 高校 AI 应用案例抽取：抓取详情页 → AI 抽取结构化字段 → 组装为 CaseStudy。
 * 与 government/enrich 同构，差异在 orgType=高等院校、sourceType=university、不强制补采。
 */

import { generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import dotenv from "dotenv";
import { fetchHtml, stripHtml } from "../lib/fetch";
import { industries, scenarios, getIndustry, getScenario } from "../../src/lib/catalog";
import { normalizeCase, buildDedupKey } from "../lib/normalize";
import type { Candidate } from "./discover";

dotenv.config();

function getModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");
  return createDeepSeek({ apiKey })("deepseek-chat");
}

function siteNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const univCaseSchema = z.object({
  isAICase: z.boolean().describe("是否真正使用了 AI/大模型/机器学习/计算机视觉/NLP/生成式AI/知识库问答/RPA+AI 等。仅信息化、建网站、普通数据库不算。"),
  title: z.string().describe("案例标题（官方原文或精炼改写，忠于原意）"),
  summary: z.string().describe("一句话摘要，不超过100字"),
  orgName: z.string().describe("院校全称，如 '清华大学'"),
  region: z.string().describe("所在城市/省份，如 '北京市' '杭州市'"),
  industrySlug: z.string().describe("单个行业标识，必须从 catalog 选择"),
  scenarioSlug: z.string().describe("单个业务场景标识，必须从 catalog 选择"),
  functions: z.array(z.string()).describe("业务职能：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理"),
  background: z.string().describe("业务背景，不超过300字。缺失则填空字符串。"),
  problem: z.string().describe("遇到的问题/挑战，不超过400字。缺失则填空字符串。"),
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
  implementedYear: z.string().describe("项目实施年份（实际落地年份）。只给一个年份且无明确实施时间则填空，禁止编造。"),
  confidence: z.string().describe("信息完整度：high / medium / pending"),
  outcomeStatus: z.string().describe("结果：success / partial / failure / undisclosed"),
});

type UnivCase = z.infer<typeof univCaseSchema>;

function buildExtractPrompt(detailText: string, candidate: Candidate): string {
  const industryOptions = industries.map((i) => `${i.slug}(${i.name})`).join(", ");
  const scenarioOptions = scenarios.map((s) => `${s.slug}(${s.name})`).join(", ");
  return `你是高校 AI 应用案例分析师。请从以下高校官网发布的案例原文中提取结构化信息。

要求：
1. 必须改写，避免原样照抄；保留核心事实。
2. 严格判断 AI 相关性：只有明确用了 AI 技术 isAICase 才为 true。
3. 字段限制：
   - industrySlug 必须从：${industryOptions} 选 **恰好一个**
   - scenarioSlug 必须从：${scenarioOptions} 选 **恰好一个**
   - functions 必须是：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理
4. 若原文缺失某字段，填空字符串，不要编造数字。
5. 年份：publishedYear 是官网发布年；implementedYear 是实际实施年；只有一个年份时填 publishedYear、implementedYear 留空。

来源网页标题：${candidate.title}
来源 URL：${candidate.url}

原文（节选）：
${detailText.slice(0, 12000)}

直接输出 JSON。`;
}

export interface EnrichedResult {
  caseStudy: ReturnType<typeof normalizeCase> | null;
  skipped: boolean;
  reason?: string;
}

export async function enrichCandidate(candidate: Candidate): Promise<EnrichedResult> {
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

  let extracted: UnivCase;
  try {
    const { output } = await generateText({
      model: getModel(),
      prompt: buildExtractPrompt(detailText, candidate),
      output: Output.object({ schema: univCaseSchema }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: 6000,
      abortSignal: AbortSignal.timeout(120_000),
    });
    extracted = output as UnivCase;
  } catch (err: any) {
    return { caseStudy: null, skipped: true, reason: `抽取失败: ${err.message || err}` };
  }

  if (!extracted.isAICase) {
    return { caseStudy: null, skipped: true, reason: "非 AI 案例" };
  }

  const publishedYear = extracted.publishedYear || new Date().getFullYear().toString();
  const raw = {
    sourceUrl: candidate.url,
    companyName: extracted.orgName || candidate.university,
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
    scenarioSlugs: [extracted.scenarioSlug],
    functions: extracted.functions,
    background: extracted.background,
    problem: extracted.problem,
    solution: extracted.solution,
    implementationSteps: extracted.implementationSteps,
    results: extracted.results,
    roi: extracted.roi,
    risks: extracted.risks,
    editorComment: {
      suitableFor: [extracted.region || candidate.region],
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

  const cs = normalizeCase(raw, extractedForNormalize as any, extracted.orgName || candidate.university);
  cs.organization = {
    name: extracted.orgName || candidate.university,
    size: "未披露",
    region: extracted.region || candidate.region,
    anonymous: false,
    type: "高等院校",
  };
  cs.industry = getIndustry(extracted.industrySlug) || cs.industry;
  cs.scenarios = [getScenario(extracted.scenarioSlug) || cs.scenarios[0]].filter(Boolean) as any;
  cs.publishedAt = publishedYear ? new Date(`${publishedYear}-01-01`).toISOString() : cs.publishedAt;
  cs.implementedAt = extracted.implementedYear ? new Date(`${extracted.implementedYear}-01-01`).toISOString() : "";
  cs.sources = [
    {
      type: "university_website",
      title: `${siteNameFromUrl(candidate.url)} - ${extracted.title || candidate.title}`,
      url: candidate.url,
    },
  ];
  cs.dedupKey = buildDedupKey(extracted.title || candidate.title, candidate.url, {
    company: (cs.organization && cs.organization.name) || "",
    summary: cs.summary || "",
    publishedYear,
  });
  cs.sourceType = "university";

  return { caseStudy: cs, skipped: false };
}
