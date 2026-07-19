import "server-only";
import { generateText, Output } from "ai";
import { createDeepSeek, type DeepSeekLanguageModelOptions } from "@ai-sdk/deepseek";
import { z } from "zod";
import { env, hasAI } from "@/lib/env";
import { createFallbackReport, type AssessmentInput } from "@/lib/assessment";
import type { AssessmentReport } from "@/lib/types";

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY ?? "" });

const reportSchema = z.object({
  companyProfile: z.string(), diagnosis: z.string(),
  recommendations: z.array(z.object({ title: z.string(), stage: z.union([z.literal(1), z.literal(2), z.literal(3)]), scenario: z.string(), reason: z.string(), prerequisites: z.array(z.string()), impact: z.enum(["高", "中", "低"]), difficulty: z.enum(["高", "中", "低"]), investment: z.string(), timeline: z.string() })).min(3).max(3),
  roi: z.object({ initialInvestment: z.string(), monthlyCost: z.string(), monthlySaving: z.string(), paybackPeriod: z.string(), confidence: z.enum(["低", "中", "高"]), assumptions: z.array(z.string()).min(3) }),
  notRecommended: z.array(z.string()).min(2), actionPlan: z.array(z.string()).min(4),
});

export async function generateAssessment(
  id: string,
  input: AssessmentInput,
  options: { strict?: boolean } = {},
): Promise<AssessmentReport> {
  const fallback = createFallbackReport(id, input);
  if (!hasAI) {
    if (options.strict) throw new Error("DEEPSEEK_NOT_CONFIGURED");
    return fallback;
  }
  try {
    const { output } = await generateText({
      model: deepseek(env.AI_MODEL),
      output: Output.object({ schema: reportSchema }),
      system: "你是中国中小企业AI改造顾问。只基于用户输入给出保守、可执行的建议。绝不虚构已实现效果；成本和ROI必须写成区间并说明假设。优先推荐边界清晰、可人工复核的小项目。用简洁中文输出 json。",
      prompt: `请生成三阶段企业AI改造建议。问诊输入：\n${JSON.stringify(input, null, 2)}`,
      providerOptions: { deepseek: { thinking: { type: "enabled" }, reasoningEffort: "max" } satisfies DeepSeekLanguageModelOptions },
      maxOutputTokens: 12_000,
      abortSignal: AbortSignal.timeout(120_000),
    });
    const roi = { ...output.roi, basis: "ai-estimate" as const, disclaimer: "该区间基于本次问诊输入与行业经验推测，不构成效果承诺。" };
    const markdown = `## 核心判断\n\n${output.diagnosis}\n\n## 三阶段建议\n\n${output.recommendations.map((item) => `### 第 ${item.stage} 阶段：${item.title}\n\n${item.reason}\n\n- 预计周期：${item.timeline}\n- 投入参考：${item.investment}`).join("\n\n")}\n\n## ROI 估算\n\n预计回收期：${roi.paybackPeriod}。\n\n> ${roi.disclaimer}`;
    return { id, sessionId: id, ...output, roi, relatedCaseSlugs: [], markdown, aiGenerated: true, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error("assessment_generation_failed", error instanceof Error ? error.message : "unknown_error");
    if (options.strict) throw error;
    return fallback;
  }
}

export async function generateFollowUp(input: Partial<AssessmentInput>) {
  const fallback = `针对“${input.repeatedWork || "这项重复工作"}”，目前每月大约处理多少次？一次通常需要几分钟、由几个人参与？`;
  if (!hasAI) return { question: fallback, aiGenerated: false };
  try { const { output } = await generateText({ model: deepseek(env.AI_FAST_MODEL), output: Output.object({ schema: z.object({ question: z.string().max(160) }) }), system: "你是企业AI问诊助手。基于已有回答只问一个最有助于估算ROI的具体追问，不做建议。请输出 json。", prompt: JSON.stringify(input), providerOptions: { deepseek: { thinking: { type: "disabled" } } satisfies DeepSeekLanguageModelOptions }, maxOutputTokens: 600, abortSignal: AbortSignal.timeout(20_000) }); return { question: output.question, aiGenerated: true }; } catch { return { question: fallback, aiGenerated: false }; }
}
