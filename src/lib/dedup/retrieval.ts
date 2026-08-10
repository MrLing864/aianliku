/**
 * 候选检索（计划三.3）
 *
 * CloudBase 当前不支持向量搜索，候选检索顺序：
 *  1. 查询相同 organizationId 下所有未删除、未合并案例。
 *  2. 超过 200 个时，先按场景和业务部门缩小范围。
 *  3. 本地计算标题、方案、业务流程和结果指标的词法相似度。
 *  4. 取前 10 个候选。
 *  5. 对前 5 个候选使用 DeepSeek 判断（在 model.ts 执行）。
 *
 * 保留 CaseCandidateRetriever 接口，未来案例量超 5 万时可接独立语义检索服务。
 */
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { lexicalSimilarity } from "./fingerprint";
import { fingerprintFromCase } from "./fingerprint";
import type { CaseFingerprint } from "./types";
import type { CaseStudy } from "@/lib/types";

export interface CandidateCase {
  id: string;
  title: string;
  fingerprint: CaseFingerprint;
  /** 综合词法相似度分（0~1） */
  lexicalScore: number;
  excerpt: string;
}

export interface CaseCandidateRetriever {
  retrieve(incoming: CaseFingerprint, organizationId?: string): Promise<CandidateCase[]>;
}

async function fetchCasesByOrg(organizationId?: string): Promise<CaseStudy[]> {
  if (!isDbConfigured() || !organizationId) return [];
  const db = await getDb();
  const coll = db.collection<CaseStudy>("cases");
  const query = {
    contentStatus: { $nin: ["deleted", "merged"] },
    mergedIntoCaseId: { $exists: false },
    "organization.id": organizationId,
  };
  const out: CaseStudy[] = [];
  const total = await coll.countDocuments(query);
  const PAGE = 100;
  const cappedTotal = Math.min(total, 1_000);
  for (let i = 0; i < cappedTotal; i += PAGE) {
    const res = await coll.find(query).skip(i).limit(PAGE).toArray();
    out.push(...res);
  }
  return out;
}

function lexicalScore(incoming: CaseFingerprint, existing: CaseFingerprint): number {
  const s1 = lexicalSimilarity(incoming.lexicalVector, existing.lexicalVector);
  const scen = incoming.primaryScenarioSlug && incoming.primaryScenarioSlug === existing.primaryScenarioSlug ? 0.15 : 0;
  const dept = incoming.department && incoming.department === existing.department ? 0.1 : 0;
  const func = incoming.businessFunctions.filter((f) => existing.businessFunctions.includes(f)).length;
  const funcScore = existing.businessFunctions.length ? (func / existing.businessFunctions.length) * 0.15 : 0;
  return Math.min(1, s1 + scen + dept + funcScore);
}

export class DefaultCandidateRetriever implements CaseCandidateRetriever {
  async retrieve(incoming: CaseFingerprint, organizationId?: string): Promise<CandidateCase[]> {
    const cases = await fetchCasesByOrg(organizationId);
    let fingerprinted = cases.map((caseStudy) => ({
      caseStudy,
      fingerprint: fingerprintFromCase(caseStudy),
    }));
    if (fingerprinted.length > 200) {
      const filtered = fingerprinted.filter(
        ({ fingerprint }) =>
          (incoming.primaryScenarioSlug &&
            fingerprint.primaryScenarioSlug === incoming.primaryScenarioSlug) ||
          (incoming.department && fingerprint.department === incoming.department),
      );
      if (filtered.length > 0) fingerprinted = filtered;
    }
    return fingerprinted
      .map(({ caseStudy, fingerprint }) => {
        return {
          id: caseStudy.id || caseStudy._id || "",
          title: caseStudy.title,
          fingerprint,
          lexicalScore: lexicalScore(incoming, fingerprint),
          excerpt: [
            caseStudy.summary,
            caseStudy.problem,
            caseStudy.solution,
            ...(caseStudy.results || []).map((result) => `${result.label} ${result.value}`),
          ]
            .filter(Boolean)
            .join("\n"),
        };
      })
      .filter((candidate) => Boolean(candidate.id))
      .sort((a, b) => b.lexicalScore - a.lexicalScore)
      .slice(0, 10);
  }
}

export const candidateRetriever: CaseCandidateRetriever = new DefaultCandidateRetriever();
