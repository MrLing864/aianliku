import "server-only";

import { getStore } from "@edgeone/pages-blob";
import { env } from "@/lib/env";

/**
 * EdgeOne Makers Blob 私有对象存储封装，用于后台来源快照（网页正文 / 抓取原文）。
 * 取代腾讯云 COS：免费版单账户 1GB，无需额外付费。
 *
 * 部署在 EdgeOne Pages（非 Makers Functions 运行时）时，需通过环境变量提供
 * EO_BLOB_PROJECT_ID 与 EO_BLOB_TOKEN；若部署为 Makers 项目，平台可自动注入凭据。
 *
 * 参考：https://cloud.tencent.com/document/product/1552/131425
 */

export function isBlobConfigured() {
  return Boolean(env.EO_BLOB_PROJECT_ID && env.EO_BLOB_TOKEN);
}

function store() {
  if (!isBlobConfigured()) throw new Error("BLOB_NOT_CONFIGURED");
  return getStore({
    name: env.EO_BLOB_STORE || "aianliku",
    projectId: env.EO_BLOB_PROJECT_ID!,
    token: env.EO_BLOB_TOKEN!,
  });
}

/**
 * 写入私有对象（覆盖）。内容类型记录在 sources.snapshotContentType 字段，
 * 读取时由调用方据此设置响应头，因此这里不依赖 SDK 的 Cache-Control 选项。
 */
export async function uploadPrivateObject(key: string, body: string, _contentType: string) {
  await store().set(key, body);
  return key;
}

/**
 * 读取私有对象内容（文本）。EdgeOne Blob 不提供短期签名下载 URL，
 * 故后台查看快照改为由服务端读取后直接代理返回，天然私有且无需签名。
 * 对象不存在时返回 null。
 */
export async function getPrivateObject(key: string): Promise<{ content: string } | null> {
  try {
    const content = await store().get(key, { type: "text" });
    if (content == null) return null;
    return { content };
  } catch {
    return null;
  }
}

export async function deletePrivateObject(key: string) {
  await store().delete(key);
}

/** 由对象 Key 的文件扩展名推断内容类型，用于代理返回时设置响应头。 */
export function contentTypeFromKey(key: string): string {
  if (key.endsWith(".html")) return "text/html; charset=utf-8";
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}
