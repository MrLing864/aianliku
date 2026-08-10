/**
 * 规则评分（计划三.4）
 *
 * 基础权重：
 *  - 企业主体 30%
 *  - AI 场景与业务流程 20%
 *  - 部门、地点 10%
 *  - 实施时间 10%
 *  - 实施商、产品 10%
 *  - 解决方案相似度 10%
 *  - 结果指标与关键数字 10%
 *
 * 缺失字段不按零分处理，从有效权重中重新归一。
 *
 * 硬性限制：满足任一条件时总分上限 0.74：
 *  - organizationId 不同且没有明确主体关系
 *  - 同企业但场景和部门均明显不同
 *  - 项目名称、地点或实施时间存在明确冲突
 */
import type { CaseFingerprint } from "./types";
import { lexicalSimilarity } from "./fingerprint";

export interface ScoringInput {
  incoming: CaseFingerprint;
  existing: CaseFingerprint;
  /** 两企业是否有明确主体关系（母子公司/同一主体） */
  hasOrgRelation: boolean;
  /** 是否明确冲突（名称/地点/时间互斥） */
  hasExplicitConflict: boolean;
}

const WEIGHTS = {
  org: 0.3,
  scenarioProcess: 0.2,
  deptLocation: 0.1,
  time: 0.1,
  implementerProduct: 0.1,
  solution: 0.1,
  metric: 0.1,
};

function overlap(a: string[], b: string[]): number {
  const left = new Set(a.map(normalizeValue).filter(Boolean));
  const right = new Set(b.map(normalizeValue).filter(Boolean));
  if (!left.size || !right.size) return 0;
  const inter = [...left].filter((value) => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union ? inter / union : 0;
}

function normalizeValue(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

function sameValue(a?: string, b?: string): boolean {
  return Boolean(a && b && normalizeValue(a) === normalizeValue(b));
}

function averageAvailable(values: Array<{ available: boolean; score: number; weight: number }>): number | undefined {
  const active = values.filter((value) => value.available);
  const totalWeight = active.reduce((sum, value) => sum + value.weight, 0);
  if (!totalWeight) return undefined;
  return active.reduce((sum, value) => sum + value.score * value.weight, 0) / totalWeight;
}

/** 计算规则分（0~1），已处理缺失字段重归一与硬性上限 */
export function scoreDuplicate(input: ScoringInput): { score: number; caps: string[] } {
  const { incoming, existing, hasOrgRelation, hasExplicitConflict } = input;
  const caps: string[] = [];
  const parts: { w: number; s: number }[] = [];

  // 企业主体
  const orgSame = Boolean(
    incoming.organizationId && incoming.organizationId === existing.organizationId,
  );
  if (incoming.organizationId && existing.organizationId) {
    parts.push({ w: WEIGHTS.org, s: orgSame || hasOrgRelation ? 1 : 0 });
  }

  // 场景与业务流程
  const hasBothScenarios = Boolean(incoming.primaryScenarioSlug && existing.primaryScenarioSlug);
  const scenarioSame = sameValue(incoming.primaryScenarioSlug, existing.primaryScenarioSlug);
  const funcSim = overlap(incoming.businessFunctions, existing.businessFunctions);
  const scenarioProcess = averageAvailable([
    { available: hasBothScenarios, score: scenarioSame ? 1 : 0, weight: 0.6 },
    {
      available: Boolean(incoming.businessFunctions.length && existing.businessFunctions.length),
      score: funcSim,
      weight: 0.4,
    },
  ]);
  if (scenarioProcess !== undefined) parts.push({ w: WEIGHTS.scenarioProcess, s: scenarioProcess });

  // 部门、地点
  const hasBothDepartments = Boolean(incoming.department && existing.department);
  const hasBothLocations = Boolean(
    incoming.implementationLocation && existing.implementationLocation,
  );
  const deptSame = sameValue(incoming.department, existing.department);
  const locSame = sameValue(incoming.implementationLocation, existing.implementationLocation);
  const deptLocation = averageAvailable([
    { available: hasBothDepartments, score: deptSame ? 1 : 0, weight: 0.6 },
    { available: hasBothLocations, score: locSame ? 1 : 0, weight: 0.4 },
  ]);
  if (deptLocation !== undefined) parts.push({ w: WEIGHTS.deptLocation, s: deptLocation });

  // 实施时间
  const yearSame = incoming.implementationYear === existing.implementationYear;
  if (incoming.implementationYear && existing.implementationYear) {
    parts.push({ w: WEIGHTS.time, s: yearSame ? 1 : 0.3 });
  }

  // 实施商、产品
  const implSim = overlap(incoming.implementers, existing.implementers);
  const prodSim = overlap(incoming.products, existing.products);
  const implementerProduct = averageAvailable([
    {
      available: Boolean(incoming.implementers.length && existing.implementers.length),
      score: implSim,
      weight: 0.5,
    },
    {
      available: Boolean(incoming.products.length && existing.products.length),
      score: prodSim,
      weight: 0.5,
    },
  ]);
  if (implementerProduct !== undefined) {
    parts.push({ w: WEIGHTS.implementerProduct, s: implementerProduct });
  }

  // 解决方案相似度（词法）
  const solSim = Math.max(
    overlap(incoming.solutionConcepts, existing.solutionConcepts),
    lexicalSimilarity(incoming.lexicalVector, existing.lexicalVector),
  );
  if (incoming.solutionConcepts.length && existing.solutionConcepts.length) {
    parts.push({ w: WEIGHTS.solution, s: solSim });
  }

  // 结果指标与关键数字
  const metricSim = overlap(incoming.metricSignatures, existing.metricSignatures);
  if (incoming.metricSignatures.length && existing.metricSignatures.length) {
    parts.push({ w: WEIGHTS.metric, s: metricSim });
  }

  const totalW = parts.reduce((s, p) => s + p.w, 0);
  const score = totalW ? parts.reduce((s, p) => s + p.w * p.s, 0) / totalW : 0;

  // 硬性上限
  const orgDifferent = Boolean(
    incoming.organizationId &&
      existing.organizationId &&
      incoming.organizationId !== existing.organizationId &&
      !hasOrgRelation,
  );
  const scenarioDeptDifferent =
    hasBothScenarios && hasBothDepartments && !scenarioSame && !deptSame;
  if (orgDifferent || scenarioDeptDifferent || hasExplicitConflict) {
    caps.push(orgDifferent ? "org_different" : scenarioDeptDifferent ? "scenario_dept_different" : "explicit_conflict");
    if (score > 0.74) return { score: 0.74, caps };
  }
  return { score, caps };
}
