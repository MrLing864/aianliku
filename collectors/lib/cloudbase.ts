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
  const existing = await collection.where({ slug: caseStudy.slug }).limit(1).get();
  const now = new Date();
  if (existing.data && existing.data.length > 0) {
    const id = existing.data[0]._id;
    await collection.doc(id).update({
      data: {
        ...caseStudy,
        updatedAt: now,
      },
    });
    return { updated: true, id };
  }
  const res = await collection.add({
    ...caseStudy,
    createdAt: now,
    updatedAt: now,
  });
  return { created: true, id: res.id };
}
