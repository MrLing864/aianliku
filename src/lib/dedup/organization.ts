/**
 * 企业主体归一（计划三.2 / 二.2 / 二.3）
 *
 * 归一顺序：
 *  1. 股票代码 / 统一社会信用代码等精确标识
 *  2. 官网域名
 *  3. 标准名称与已确认别名
 *  4. 归一化名称
 *  5. DeepSeek 辅助判断（仅提供别名建议，不自动合并两个企业）
 *
 * 处理规则：
 *  - 精确标识命中：自动关联
 *  - 已确认别名命中：自动关联
 *  - 只有模型判断且缺确定证据：进入 organization_review
 *  - 无相似主体：创建 pending_review 新主体
 *  - 母公司与子公司默认不同主体，不合并
 */
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import "server-only";
import { contentHash } from "./source-identity";
import type { Organization, OrganizationAlias, AliasType } from "./types";

export function normalizeOrganizationName(name?: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w\u4e00-\u9fa5]/g, "")
    .replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "")
    .trim();
}

export interface OrganizationMatchResult {
  organizationId?: string;
  /** 是否需要人工审核（仅模型判断、缺确定证据） */
  needsReview: boolean;
  /** 是否新建主体 */
  created: boolean;
  reason: string;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}_${contentHash("", value).slice(0, 20)}`;
}

function normalizeDomain(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.trim().replace(/^www\./i, "").toLowerCase();
  }
}

interface MatchInput {
  name?: string;
  englishNames?: string[];
  domain?: string;
  stockCode?: string;
  unifiedSocialCreditCode?: string;
  parentHint?: string;
}

function organizationId(record: Organization & { _id?: string }): string | undefined {
  return record.id || record._id;
}

/**
 * 归一化企业主体：优先精确标识，其次域名，再次已确认别名/归一化名。
 * 命中则返回 organizationId；无命中创建 pending_review 主体。
 */
export async function resolveOrganization(input: MatchInput): Promise<OrganizationMatchResult> {
  if (!isDbConfigured()) {
    return { needsReview: true, created: false, reason: "db_unavailable" };
  }
  const db = await getDb();
  const orgColl = db.collection("organizations");
  const aliasColl = db.collection("organization_aliases");

  // 1. 精确标识：股票代码 / 统一社会信用代码
  if (input.stockCode || input.unifiedSocialCreditCode) {
    const exact = input.stockCode
      ? await orgColl.findOne({ "externalIds.stockCode": input.stockCode.trim() })
      : await orgColl.findOne({
          "externalIds.unifiedSocialCreditCode": input.unifiedSocialCreditCode?.trim(),
        });
    if (exact) {
      return {
        organizationId: organizationId(exact as Organization & { _id?: string }),
        needsReview: false,
        created: false,
        reason: "exact_external_id",
      };
    }
  }

  // 2. 官网域名
  const domain = normalizeDomain(input.domain);
  if (domain) {
    const byDomain = await orgColl.findOne({ officialDomain: domain });
    if (byDomain) {
      return {
        organizationId: organizationId(byDomain as Organization & { _id?: string }),
        needsReview: false,
        created: false,
        reason: "official_domain",
      };
    }
  }

  const norm = normalizeOrganizationName(input.name);
  if (!norm) return { needsReview: true, created: false, reason: "empty_name" };

  // 3. 已确认别名（唯一索引 normalizedAlias）
  const byAlias = await aliasColl.findOne({ normalizedAlias: norm, status: "active" });
  if (byAlias) {
    return { organizationId: (byAlias as OrganizationAlias).organizationId, needsReview: false, created: false, reason: "confirmed_alias" };
  }

  // 4. 归一化名称
  const byNorm = await orgColl.findOne({ normalizedName: norm, status: { $in: ["active", "pending_review"] } });
  if (byNorm) {
    const existing = byNorm as Organization;
    // 母子公司不自动合并：若输入含母公司提示且 existing 是不同主体，进入 review
    if (input.parentHint && existing.parentOrganizationId && existing.parentOrganizationId !== input.parentHint) {
      return { needsReview: true, created: false, reason: "parent_conflict_review" };
    }
    return {
      organizationId: organizationId(existing as Organization & { _id?: string }),
      needsReview: existing.status !== "active",
      created: false,
      reason: existing.status === "active" ? "normalized_name" : "pending_organization",
    };
  }

  // 5. 无相似主体：创建 pending_review 新主体（模型辅助判断不在此自动合并）
  const id = stableId("org", norm);
  const now = new Date().toISOString();
  const org: Organization = {
    id,
    canonicalName: input.name || norm,
    normalizedName: norm,
    englishNames: input.englishNames || [],
    historicalNames: [],
    officialDomain: domain,
    externalIds: {
      stockCode: input.stockCode,
      unifiedSocialCreditCode: input.unifiedSocialCreditCode,
    },
    status: "pending_review",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  try {
    await orgColl.replaceOne({ _id: id }, org, { upsert: true });
  } catch (error) {
    const raced = await orgColl.findOne({ normalizedName: norm });
    if (!raced) throw error;
    return {
      organizationId: organizationId(raced as Organization & { _id?: string }),
      needsReview: (raced as Organization).status !== "active",
      created: false,
      reason: "concurrent_normalized_name",
    };
  }
  // 同步写入别名，便于后续精确匹配
  const alias: OrganizationAlias = {
    id: stableId("al", norm),
    organizationId: id,
    alias: input.name || norm,
    normalizedAlias: norm,
    aliasType: "人工纠错" as AliasType,
    confidence: 1,
    status: "pending_review",
  };
  await aliasColl.replaceOne({ _id: alias.id }, alias, { upsert: true });
  return { organizationId: id, needsReview: true, created: true, reason: "created_pending" };
}

/**
 * 模型辅助：仅提出建议别名，不自动合并。返回建议供人工审核。
 */
export function suggestAlias(name: string, suggestion: { alias: string; aliasType: AliasType; confidence: number }): OrganizationAlias {
  const norm = normalizeOrganizationName(suggestion.alias);
  return {
    id: stableId("al", norm),
    organizationId: "",
    alias: suggestion.alias,
    normalizedAlias: norm,
    aliasType: suggestion.aliasType,
    confidence: suggestion.confidence,
    status: "pending_review",
  };
}
