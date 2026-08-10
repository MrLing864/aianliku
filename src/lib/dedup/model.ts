/**
 * DeepSeek 两阶段项目关系判断（计划三.5）
 *
 * 第一阶段：对候选给出 relationship / confidence / matched/conflicting/missing facts / reason / recommendedAction。
 * 第二阶段：独立提示词重新读取两案例来源证据，复核是否同一企业、同部门同流程、是否只是同类场景、
 *           是否试点/扩建/二期/升级、数字地点时间实施商是否冲突、是否互相转载。
 * 两次结论不一致 → 统一标记 insufficient_evidence，进入复核，不自动创建/合并。
 *
 * 复用 src/lib/ai/assessment.ts 的 ai 调用模式。无 AI 配置或异常时安全降级为规则主导。
 */
import "server-only";
import { generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { env, hasAI } from "@/lib/env";
import type { DuplicateRelationship, DuplicateResolution, CaseFingerprint } from "./types";

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY ?? "" });

export const RELATIONSHIPS: DuplicateRelationship[] = [
  "same_project",
  "project_evolution",
  "same_org_different_project",
  "different_project",
  "insufficient_evidence",
];

const stage1Schema = z.object({
  relationship: z.enum(["same_project", "project_evolution", "same_org_different_project", "different_project", "insufficient_evidence"]),
  confidence: z.number().min(0).max(1),
  matchedFacts: z.array(z.string()).max(12),
  conflictingFacts: z.array(z.string()).max(12),
  missingFacts: z.array(z.string()).max(8),
  evidenceRefs: z.array(z.string()).max(8),
  reason: z.string().max(800),
  recommendedAction: z.enum(["supplement_existing", "distinct_project", "independent_case", "defer", "invalid_record"]),
});

const stage2Schema = z.object({
  sameEnterprise: z.boolean(),
  sameDepartmentProcess: z.boolean(),
  onlySimilarScenario: z.boolean(),
  evolutionStage: z.boolean(),
  hasConflict: z.boolean(),
  mutualReprint: z.boolean(),
  relationship: z.enum(["same_project", "project_evolution", "same_org_different_project", "different_project", "insufficient_evidence"]),
  confidence: z.number().min(0).max(1),
  note: z.string().max(500),
});

function compactFingerprint(fp: CaseFingerprint): Record<string, unknown> {
  return {
    organizationId: fp.organizationId,
    projectName: fp.projectName,
    primaryScenarioSlug: fp.primaryScenarioSlug,
    businessFunctions: fp.businessFunctions,
    department: fp.department,
    implementationLocation: fp.implementationLocation,
    implementationYear: fp.implementationYear,
    projectPhase: fp.projectPhase,
    implementers: fp.implementers,
    products: fp.products,
    metricSignatures: fp.metricSignatures,
  };
}

interface ModelContext {
  incomingTitle: string;
  incomingFingerprint: CaseFingerprint;
  existingTitle: string;
  existingFingerprint: CaseFingerprint;
  incomingExcerpt?: string;
  existingExcerpt?: string;
}

async function callStage<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T | null> {
  if (!hasAI) return null;
  try {
    const { output } = await generateText({
      model: deepseek(env.AI_MODEL),
      output: Output.object({ schema }),
      system,
      prompt,
      providerOptions: { deepseek: { thinking: { type: "enabled" }, reasoningEffort: "max" } },
      maxOutputTokens: 4000,
      abortSignal: AbortSignal.timeout(90_000),
    });
    return output as T;
  } catch (error) {
    console.error(
      "[dedup-model] structured judgement failed",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export interface ModelJudgement {
  relationship: DuplicateRelationship;
  modelScore: number;
  verificationScore: number;
  matchedFacts: string[];
  conflictingFacts: string[];
  missingFacts: string[];
  evidenceRefs: string[];
  recommendedAction: DuplicateResolution;
  /** 两次结论是否一致 */
  consistent: boolean;
  reason: string;
}

/** 两阶段判断 + 一致性校验 */
export async function judgeRelationship(ctx: ModelContext): Promise<ModelJudgement> {
  const base = `候选案例（待入库）：${ctx.incomingTitle}\n${JSON.stringify(compactFingerprint(ctx.incomingFingerprint), null, 2)}\n来源证据：${ctx.incomingExcerpt?.slice(0, 4_000) || ""}\n\n已有案例：${ctx.existingTitle}\n${JSON.stringify(compactFingerprint(ctx.existingFingerprint), null, 2)}\n来源证据：${ctx.existingExcerpt?.slice(0, 4_000) || ""}`;

  const [stage1, stage2] = await Promise.all([
    callStage(
      stage1Schema,
      "你是企业AI案例去重专家。判断两篇案例是否为同一AI项目。仅依据给定事实，不臆造；同一企业做相似场景不能单独证明是同一项目。严格返回约定的JSON。",
      `${base}\n\n请判断两案例关系，并给出matched/conflicting/missing事实与建议动作。`,
    ),
    callStage(
      stage2Schema,
      "你是独立复核员，重新读取两案例证据，重点核对：是否同一被改造企业；是否同一业务部门和流程；是否只是同类场景而非同一项目；是否属于试点/扩建/二期/升级；数字/地点/时间/实施商是否冲突；两文是否互相转载。严格返回约定的JSON。",
      `${base}\n\n请独立复核并给出最终关系判断。`,
    ),
  ]);

  // 无 AI 或异常：降级
  if (!stage1 || !stage2) {
    return {
      relationship: "insufficient_evidence",
      modelScore: 0,
      verificationScore: 0,
      matchedFacts: [],
      conflictingFacts: [],
      missingFacts: [],
      evidenceRefs: [],
      recommendedAction: "defer",
      consistent: false,
      reason: "model_unavailable",
    };
  }

  const consistent = stage1.relationship === stage2.relationship;
  // 两次不一致 → 统一 insufficient_evidence
  const relationship: DuplicateRelationship = consistent ? stage1.relationship : "insufficient_evidence";
  const modelScore = stage1.confidence;
  const verificationScore = stage2.confidence;
  const recommendedAction: DuplicateResolution =
    relationship === "same_project"
      ? "supplement_existing"
      : relationship === "project_evolution"
      ? "defer"
      : relationship === "same_org_different_project"
      ? "distinct_project"
      : relationship === "different_project"
      ? "independent_case"
      : "defer";

  return {
    relationship,
    modelScore,
    verificationScore,
    matchedFacts: stage1.matchedFacts,
    conflictingFacts: stage1.conflictingFacts,
    missingFacts: stage1.missingFacts,
    evidenceRefs: stage1.evidenceRefs,
    recommendedAction,
    consistent,
    reason: `${stage1.reason}\n[复核] ${stage2.note}`,
  };
}

/**
 * 综合分数（计划三.5 末尾）：
 *  - same_project：overall = 规则分 × 0.65 + 复核置信度 × 0.35
 *  - different_project：总分上限 0.74
 *  - project_evolution：进入人工复核（分数不用于自动决策）
 */
export function combineScores(ruleScore: number, judgement: ModelJudgement): number {
  if (judgement.relationship === "same_project") {
    return ruleScore * 0.65 + judgement.verificationScore * 0.35;
  }
  if (
    judgement.relationship === "different_project" ||
    judgement.relationship === "same_org_different_project"
  ) {
    return Math.min(ruleScore, 0.74);
  }
  // insufficient_evidence / project_evolution / same_org_different_project → 不自动决策
  return ruleScore;
}
