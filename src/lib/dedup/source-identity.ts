/**
 * 来源身份识别（计划三.1 / 六）
 *
 * 来源精确幂等规则：
 *  1. 相同规范 URL：更新原来源，不新增。
 *  2. 相同发布方 + 外部编号：更新原来源。
 *  3. 相同发布方 + 内容哈希：视为同一来源版本。
 *  4. 不同发布方但内容完全相同：保留两个来源，标记同一转载组，不重复计为独立证据。
 */
import { createHash } from "node:crypto";
import type { SourceIdentity } from "./types";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "spm",
  "ref",
]);

/** FNV-1a 32 位哈希（稳定、无依赖），用于 URL/内容指纹 */
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function normalizeUrl(raw?: string): string {
  if (!raw || typeof raw !== "string") return "";
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    const host = u.host.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    const query = u.searchParams.toString();
    return `${host}${path}${query ? `?${query}` : ""}`;
  } catch {
    return raw
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/#.*$/, "")
      .replace(/\/+$/, "");
  }
}

export function normalizePublisher(name?: string): string {
  return (name || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").trim();
}

/** 内容指纹：标题 + 正文关键段落，去空白后取 hash */
export function contentHash(title: string, rawText: string): string {
  const normalizedTitle = (title || "").normalize("NFKC").trim().toLowerCase();
  const normalizedText = (rawText || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  return createHash("sha256")
    .update(`${normalizedTitle}\n${normalizedText}`)
    .digest("hex");
}

export function buildSourceIdentity(input: {
  sourceUrl?: string;
  publisher?: string;
  externalId?: string;
  title?: string;
  rawText?: string;
}): SourceIdentity {
  const normalizedUrl = normalizeUrl(input.sourceUrl);
  return {
    normalizedUrl,
    normalizedUrlHash: normalizedUrl
      ? createHash("sha256").update(normalizedUrl).digest("hex")
      : "",
    publisherNormalized: normalizePublisher(input.publisher),
    externalId: (input.externalId || "").trim(),
    contentHash: contentHash(input.title || "", input.rawText || ""),
  };
}
