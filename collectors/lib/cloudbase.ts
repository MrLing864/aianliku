import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";
import type { CaseStudy } from "./normalize";

dotenv.config();

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV!,
  secretId: process.env.CLOUDBASE_SECRET_ID!,
  secretKey: process.env.CLOUDBASE_SECRET_KEY!,
});

const db = app.database();

let collectionEnsured = false;

async function ensureCollection() {
  if (collectionEnsured) return;
  try {
    await db.createCollection("cases");
    console.log("[db] 已创建集合 cases");
  } catch (err: any) {
    // 集合已存在或其他错误时忽略
    if (!err.message?.includes("already exists") && !err.message?.includes("DUPLICATE_COLLECTION")) {
      console.warn("[db] 创建集合提示:", err.message || err);
    }
  }
  collectionEnsured = true;
}

// 网站（src/lib/repositories/cases.ts）只读 `cases` 集合，采集器必须写入同一集合才能在前台显示。
export async function upsertCase(caseStudy: CaseStudy) {
  await ensureCollection();
  const collection = db.collection("cases");

  // 优先按 dedupKey 去重（标题归一化 + 域名 + 年份），再回退 slug。
  const dedupKey = (caseStudy as any).dedupKey;
  let existingId: string | null = null;
  if (dedupKey) {
    const byKey = await collection.where({ dedupKey }).limit(1).get();
    if (byKey.data && byKey.data.length > 0) existingId = byKey.data[0]._id;
  }
  if (!existingId) {
    const bySlug = await collection.where({ slug: caseStudy.slug }).limit(1).get();
    if (bySlug.data && bySlug.data.length > 0) existingId = bySlug.data[0]._id;
  }

  const now = new Date();
  // 顶层 sourceUrl 索引字段：供采集前"按 URL 预去重"快速判重，避免对重复案例重复调用 LLM。
  const sourceUrl = (caseStudy.sources && caseStudy.sources[0] && caseStudy.sources[0].url) || "";
  if (existingId) {
    // 已存在：仅补充缺失字段，不覆盖已有详情
    await collection.doc(existingId).update({
      data: {
        ...caseStudy,
        sourceUrl,
        updatedAt: now,
      },
    });
    return { updated: true, id: existingId };
  }
  const res = await collection.add({
    ...caseStudy,
    sourceUrl,
    createdAt: now,
    updatedAt: now,
  });
  return { created: true, id: res.id };
}

/** 批量去重检查：返回已存在于数据库中的 dedupKey 集合，用于采集前预过滤。 */
export async function existingDedupKeys(keys: string[]): Promise<Set<string>> {
  if (keys.length === 0) return new Set();
  await ensureCollection();
  const collection = db.collection("cases");
  const found = new Set<string>();
  // CloudBase where in 单次上限，分批查询
  const BATCH = 50;
  for (let i = 0; i < keys.length; i += BATCH) {
    const chunk = keys.slice(i, i + BATCH);
    const res = await collection.where({ dedupKey: collection.command.in(chunk) }).field({ dedupKey: true }).limit(100).get();
    for (const d of res.data || []) {
      if (d.dedupKey) found.add(d.dedupKey);
    }
  }
  return found;
}

/** 批量 URL 预去重：返回已存在于数据库中的 sourceUrl 集合，用于 enrich 前快速拦截重复案例（零 LLM 消耗）。 */
export async function existingSourceUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  await ensureCollection();
  const collection = db.collection("cases");
  const found = new Set<string>();
  const BATCH = 50;
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const res = await collection.where({ sourceUrl: collection.command.in(chunk) }).field({ sourceUrl: true }).limit(100).get();
    for (const d of res.data || []) {
      if (d.sourceUrl) found.add(d.sourceUrl);
    }
  }
  return found;
}
