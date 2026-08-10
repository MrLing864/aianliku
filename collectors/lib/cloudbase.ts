import dotenv from "dotenv";
import type { CaseStudy } from "./normalize";

dotenv.config();

/**
 * 采集器 V2 入库改造（计划五.3）
 *
 * 采集器不再直连 CloudBase 写 `cases`，改为调用网站后台统一去重接入端点
 * `/api/internal/collector-ingest`，由 runDedupPipeline 处理来源幂等、分段、
 * 企业归一、项目匹配与重复决策。只有明确不同项目且内容质量通过时才创建案例。
 *
 * 配置：
 *  - INTERNAL_API_BASE_URL（默认 http://localhost:3000）
 *  - INTERNAL_API_KEY（与网站 env.INTERNAL_API_KEY 一致）
 */
const API_BASE = process.env.INTERNAL_API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.INTERNAL_API_KEY || "";

interface IngestResponse {
  ok?: boolean;
  sourceCreated?: boolean;
  sourceId?: string;
  createdCaseId?: string;
  needsReview?: boolean;
  error?: string;
}

async function postIngest(payload: Record<string, unknown>): Promise<IngestResponse> {
  if (!API_KEY) throw new Error("INTERNAL_API_KEY 未配置");
  const res = await fetch(`${API_BASE}/api/internal/collector-ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": API_KEY },
    body: JSON.stringify(payload),
  });
  const result = (await res.json().catch(() => ({}))) as IngestResponse;
  if (!res.ok) throw new Error(result.error || `接入服务返回 HTTP ${res.status}`);
  return result;
}

/**
 * 采集器统一入库入口：提交原始案例给后台去重服务。
 * 不再直接写 cases，不再按 sourceUrl 命中即跳过或覆盖；
 * 高/中疑似重复由后台进入审核队列，不自动发布。
 */
export async function upsertCase(caseStudy: CaseStudy) {
  const rawSourceUrl = (caseStudy.sources && caseStudy.sources[0] && caseStudy.sources[0].url) || "";
  const sourceUrl = rawSourceUrl.trim();
  const org = caseStudy.organization?.name || "";
  const firstSource = caseStudy.sources?.[0];
  const firstImplementer = caseStudy.implementers?.[0];
  const payload = {
    title: caseStudy.title,
    organization: org,
    sourceUrl,
    sourceType: caseStudy.sourceType || firstSource?.type || "web",
    publisher: firstSource?.title || firstImplementer?.name || "",
    externalId: caseStudy.dedupKey || "",
    publishedAt: caseStudy.publishedAt || "",
    scenario: caseStudy.scenarios?.[0]?.slug || "",
    department: caseStudy.businessFunctions?.[0] || "",
    implementer: firstImplementer?.name || "",
    solution: caseStudy.solution || "",
    result: (caseStudy.results || [])
      .map((item) => `${item.label}：${item.value}`)
      .join("；"),
    rawText: [caseStudy.summary, caseStudy.background, caseStudy.problem, caseStudy.solution, caseStudy.roi]
      .filter(Boolean)
      .join("\n"),
    caseDraft: caseStudy as unknown as Record<string, unknown>,
  };
  try {
    const r = await postIngest(payload);
    if (r?.ok) {
      return {
        created: Boolean(r.createdCaseId),
        updated: !r.createdCaseId && !r.needsReview,
        id: r.createdCaseId || r.sourceId,
        needsReview: r.needsReview,
      };
    }
    // 后台返回 ok:false 表示进入暂存/冲突兜底，不视为失败
    return { created: false, updated: false, id: r?.sourceId, needsReview: r?.needsReview, deferred: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ingest] 调用后台去重服务失败: ${message}`);
    return { created: false, updated: false, error: message };
  }
}

/** 轻量预过滤：返回已存在于库中的归一化 sourceUrl 集合，用于 enrich 前快速跳过明显重复（零 LLM）。 */
export async function existingSourceUrls(urls: string[]): Promise<Set<string>> {
  // 仅凭 URL 无法知道网页内容是否已经更新。成本不是约束，统一让接入端在抓取正文后
  // 比较内容哈希，避免旧 URL 永久挡住新版本，也避免误把本批全部 URL 当成已存在。
  void urls;
  return new Set<string>();
}
