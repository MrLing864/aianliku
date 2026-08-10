/**
 * 采集运行记录器（统一 run-log 协议）。
 *
 * 所有采集入口脚本（互联网大厂 run.ts / 政府机关 government/run.ts / 未来 universities·companies）
 * 都应通过本模块写入一条 collector_runs 记录，便于管理后台按天、按分类查看
 * 各定时器更新的条数、成功/失败/去重情况。
 *
 * 设计要点：
 *  - startRun 立即写一条 status:"running" 的父记录；
 *  - 通过 session.inc(...) 累加计数器；
 *  - session.finish(...) 收尾写最终 status + counts；
 *  - 即使脚本崩溃（run().catch → process.exit(1)），也应在退出前调用 fail(err)，
 *    保证后台能看到失败记录，而不是完全无痕。
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

let collectionEnsured = false;
async function ensureRunCollection() {
  if (collectionEnsured) return;
  try {
    await db.createCollection("collector_runs");
    console.log("[runlog] 已创建集合 collector_runs");
  } catch (err: any) {
    if (!err.message?.includes("already exists") && !err.message?.includes("DUPLICATE_COLLECTION")) {
      console.warn("[runlog] 创建集合提示:", err.message || err);
    }
  }
  collectionEnsured = true;
}

export type RunCategory = "internet_giant" | "government" | "university" | "famous_company";

export const CATEGORY_NAMES: Record<RunCategory, string> = {
  internet_giant: "互联网大厂",
  government: "政府机关",
  university: "高等院校",
  famous_company: "知名企业",
};

export interface RunCounters {
  candidates: number; // 候选链接数
  aiCases: number; // 判定为 AI 案例（保留）
  success: number; // 成功入库（created + updated）
  created: number; // 其中新增
  updated: number; // 其中去重命中（更新=你看到的“重复/去重”）
  failed: number; // 入库或处理失败
  skipped: number; // 非AI/过滤/robots
  prededup: number; // URL 预去重跳过的候选数（已存在，未调用 LLM）
}

const EMPTY_COUNTERS: RunCounters = {
  candidates: 0,
  aiCases: 0,
  success: 0,
  created: 0,
  updated: 0,
  failed: 0,
  skipped: 0,
  prededup: 0,
};

export interface RunLogSession {
  runId: string;
  category: RunCategory;
  /** 累加计数器（增量或给定完整对象） */
  inc(partial: Partial<RunCounters>): void;
  /** 直接设置某字段的最终值（如 candidates 一开始就已知） */
  set(partial: Partial<RunCounters>): void;
  /** 收尾：根据当前计数推断 success，写最终状态 */
  finish(status?: "success" | "partial" | "failed"): Promise<void>;
  /** 崩溃时调用：标记 failed 并写入错误信息 */
  fail(error: unknown): Promise<void>;
}

function genRunId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 开启一次采集运行记录。
 * @param category 采集分类（互联网大厂/政府机关/高等院校/知名企业）
 * @param source 细分源标识（tencent/aliyun/huawei/gov/...）
 * @param sourceName 细分源名称（腾讯云/阿里云/政府机关/...）
 * @param scheduledBy 触发方式：cron（定时器）或 manual（手动）
 */
export function startRun(
  category: RunCategory,
  source: string,
  sourceName: string,
  scheduledBy: "cron" | "manual"
): RunLogSession {
  const runId = genRunId();
  const counters: RunCounters = { ...EMPTY_COUNTERS };
  let docId: string | null = null;
  let finished = false;

  const baseDoc = {
    runId,
    category,
    categoryName: CATEGORY_NAMES[category],
    source,
    sourceName,
    scheduledBy,
    triggeredAt: new Date(),
    status: "running" as const,
  };

  // 异步写库，不阻塞主流程
  (async () => {
    try {
      await ensureRunCollection();
      const res = await db.collection("collector_runs").add(baseDoc);
      docId = res.id;
    } catch (err: any) {
      console.warn("[runlog] 写入 running 记录失败（不影响主流程）:", err.message || err);
    }
  })();

  const writeUpdate = async (extra: Record<string, any>) => {
    if (!docId) return;
    // 注意：CloudBase 的 doc().update({ data: {...} }) 在本项目环境下会把负载
    // 原样写成一个名为 data 的嵌套字段（导致 counts/status 落在 data.counts、
    // data.status 下，后台读取顶层字段时全是 undefined，页面直接崩）。
    // 这里改用 set() 覆盖写入完整文档，确保字段稳定落在顶层。
    const fullDoc = { ...baseDoc, ...extra, counts: { ...counters } };
    try {
      await db.collection("collector_runs").doc(docId).set(fullDoc);
    } catch (err: any) {
      console.warn("[runlog] 更新记录失败:", err.message || err);
    }
  };

  const session: RunLogSession = {
    runId,
    category,
    inc(partial) {
      for (const k of Object.keys(partial) as (keyof RunCounters)[]) {
        counters[k] += partial[k] || 0;
      }
    },
    set(partial) {
      for (const k of Object.keys(partial) as (keyof RunCounters)[]) {
        counters[k] = partial[k] || 0;
      }
    },
    async finish(status) {
      if (finished) return;
      finished = true;
      // success = created + updated；若未显式传 status，则按失败数推断
      const finalStatus: "success" | "partial" | "failed" =
        status ||
        (counters.failed > 0 && counters.success === 0
          ? "failed"
          : counters.failed > 0
          ? "partial"
          : "success");
      await writeUpdate({ status: finalStatus, finishedAt: new Date() });
    },
    async fail(error) {
      if (finished) return;
      finished = true;
      const msg = error instanceof Error ? error.message : String(error);
      await writeUpdate({ status: "failed", finishedAt: new Date(), errorMessage: msg });
    },
  };

  return session;
}
