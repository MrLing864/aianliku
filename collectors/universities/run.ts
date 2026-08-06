/**
 * 高校（985/211）AI 应用案例采集入口。
 * 用法：npx tsx collectors/universities/run.ts [--limit=N] [--unis=清华,北大] [--write-db] [--dry-run]
 * 接入统一运行记录器 runlog（category=university）。
 */

import { discoverCandidates, type Candidate } from "./discover";
import { enrichCandidate } from "./enrich";
import { mapLimit, sleep, canFetch } from "../lib/fetch";
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";
import { startRun, type RunLogSession } from "../lib/runlog";

function parseArgs() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0", 10) || undefined;
  const dryRun = args.includes("--dry-run");
  const writeDb = args.includes("--write-db");
  const unis = args.find((a) => a.startsWith("--unis="))?.split("=")[1]?.split(",").map((s) => s.trim()).filter(Boolean);
  const out = args.find((a) => a.startsWith("--out="))?.split("=")[1];
  return { limit, dryRun, writeDb, unis, out };
}

let runSession: RunLogSession | null = null;

async function run() {
  const { limit, dryRun, writeDb, unis, out } = parseArgs();

  runSession = startRun("university", "university", "高等院校", writeDb ? "cron" : "manual");

  console.log(`[univ] 开始采集（writeDb=${writeDb}, limit=${limit ?? "∞"}, unis=${unis?.join("/") ?? "全部 985/211"}）`);

  const candidates = await discoverCandidates({ unis, cap: limit });
  if (candidates.length === 0) {
    console.log("[univ] 未发现候选案例");
    runSession.set({ candidates: 0 });
    await runSession.finish("success");
    return;
  }

  runSession.set({ candidates: candidates.length });

  const limited = limit ? candidates.slice(0, limit) : candidates;

  const enriched = await mapLimit(limited, 2, async (c: Candidate) => {
    const r = await enrichCandidate(c);
    return r;
  });

  const aiCases = enriched.filter((e) => e.caseStudy && !e.skipped).map((e) => e.caseStudy!);
  const skipped = enriched.filter((e) => e.skipped);
  const errors = enriched.filter((e) => e.skipped && (e.reason || "").includes("失败"));

  console.log(`[univ] 抽取完成：候选 ${limited.length}，AI 案例 ${aiCases.length}，跳过 ${skipped.length}，失败 ${errors.length}`);

  // 写入本地报告（双写，便于排查）
  const reportRaw = {
    triggeredAt: new Date().toISOString(),
    candidates: limited.length,
    aiCases: aiCases.length,
    skipped: skipped.length,
    errors: errors.length,
    created: 0,
    updated: 0,
    cases: aiCases.map((c) => ({ title: c.title, org: c.organization.name, url: c.sources?.[0]?.url })),
  };
  const reportPath = out || "/var/log/univ-collect-report.json";
  try {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(reportRaw, null, 2));
  } catch (e: any) {
    console.warn(`[univ] 写报告失败 ${reportPath}: ${e.message}`);
  }

  if (dryRun) {
    console.log("[univ] dry-run 完成，不写库");
    runSession.inc({ aiCases: aiCases.length, skipped: skipped.length, failed: errors.length });
    await runSession.finish();
    return;
  }

  // Write to CloudBase
  const { upsertCase } = await import("../lib/cloudbase");
  let created = 0;
  let updated = 0;
  for (const c of aiCases) {
    try {
      const r = await upsertCase(c);
      if (r.created) created++;
      else updated++;
      console.log(`[db] 已入库: ${c.organization.name} - ${c.title}`);
    } catch (err: any) {
      console.error(`[db] 入库失败 ${c.organization.name}:`, err.message || err);
    }
  }
  console.log(`[univ] 数据库写入完成：新建 ${created}，更新（去重）${updated}`);

  runSession.inc({ aiCases: aiCases.length, skipped: skipped.length, failed: errors.length, created, updated });
  await runSession.finish();
}

run().catch((err) => {
  console.error(err);
  runSession?.fail(err).finally(() => process.exit(1));
});
