/**
 * 上市公司采集进度游标（支持循环抓取）。
 *
 * 由于采集脚本在 Docker 中无状态运行，进度必须持久化到外部存储。
 * 这里使用 CloudBase 集合 `company_collect_cursor` 记录一条游标文档：
 *   { _id: "cursor", index: number, round: number, lastRunAt: Date, lastCompany: string }
 *
 * 调度规则（见 run.ts）：
 *   - 每天从 index 处切片取 DAILY_COMPANY_LIMIT 家企业采集；
 *   - 采集完成后 index 前移；若越过末尾则回到 0 并 round+1（循环）；
 *   - 这样"全部上市公司抓取完毕后，再从头循环抓取"。
 */

import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV!,
  secretId: process.env.CLOUDBASE_SECRET_ID!,
  secretKey: process.env.CLOUDBASE_SECRET_KEY!,
});
const db = app.database();
const COLL = "company_collect_cursor";
const DOC_ID = "cursor";

let ensured = false;
async function ensure() {
  if (ensured) return;
  try {
    await db.createCollection(COLL);
    console.log("[progress] 已创建集合", COLL);
  } catch (err: any) {
    if (!err.message?.includes("already exists") && !err.message?.includes("DUPLICATE_COLLECTION")) {
      console.warn("[progress] 创建集合提示:", err.message || err);
    }
  }
  ensured = true;
}

export interface CursorState {
  index: number;
  round: number;
  lastRunAt?: Date;
  lastCompany?: string;
}

/** 读取游标；不存在则返回初始 {index:0, round:1}。 */
export async function readCursor(): Promise<CursorState> {
  await ensure();
  const res = await db.collection(COLL).doc(DOC_ID).get();
  const docs = (res as any).data || [];
  if (!docs.length) return { index: 0, round: 1 };
  const d = docs[0];
  return {
    index: typeof d.index === "number" ? d.index : 0,
    round: typeof d.round === "number" ? d.round : 1,
    lastRunAt: d.lastRunAt,
    lastCompany: d.lastCompany,
  };
}

/** 写回游标。 */
export async function writeCursor(state: CursorState): Promise<void> {
  await ensure();
  try {
    await db.collection(COLL).doc(DOC_ID).set({
      index: state.index,
      round: state.round,
      lastRunAt: new Date(),
      lastCompany: state.lastCompany || "",
    });
  } catch (err: any) {
    console.warn("[progress] 写回游标失败（不影响本次采集）:", err.message || err);
  }
}
