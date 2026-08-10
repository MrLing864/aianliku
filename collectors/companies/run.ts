/**
 * 企业（A 股 + 港股上市公司）AI 应用案例采集入口。
 *
 * 用法：
 *   npx tsx collectors/companies/run.ts [--write-db] [--dry-run]
 *     —— 今日循环模式：从进度游标切片 DAILY_COMPANY_LIMIT(100) 家企业采集，采完循环。
 *   npx tsx collectors/companies/run.ts --companies=宁德时代,比亚迪 [--limit=N] [--write-db] [--dry-run]
 *     —— 手动模式：仅采指定企业（覆盖全部上市公司名单）。
 *
 * 接入统一运行记录器 runlog（category=famous_company）。
 */

import { discoverCandidates, type Candidate } from "./discover";
import { enrichCandidate } from "./enrich";
import { getAllListedCompanies, makeCompanyConfig } from "./list";
import { readCursor, writeCursor } from "./progress";
import { DAILY_COMPANY_LIMIT } from "./config";
import { mapLimit } from "../lib/fetch";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { startRun, type RunLogSession } from "../lib/runlog";
import { existingSourceUrls } from "../lib/cloudbase";

function parseArgs() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0", 10) || undefined;
  const dryRun = args.includes("--dry-run");
  const writeDb = args.includes("--write-db");
  const companies = args.find((a) => a.startsWith("--companies="))?.split("=")[1]?.split(",").map((s) => s.trim()).filter(Boolean);
  const out = args.find((a) => a.startsWith("--out="))?.split("=")[1];
  return { limit, dryRun, writeDb, companies, out };
}

let runSession: RunLogSession | null = null;

async function run() {
  const { limit, dryRun, writeDb, companies, out } = parseArgs();

  runSession = startRun("famous_company", "company", "知名企业", writeDb ? "cron" : "manual");

  let discoverOpts: Parameters<typeof discoverCandidates>[0];
  let todayCompanies: string[] = [];

  if (companies && companies.length) {
    // 手动模式：仅采指定企业（覆盖全部上市公司名单）
    console.log(`[company] 手动模式：采 ${companies.join("/")}（limit=${limit ?? "∞"}）`);
    const configs = companies.map((n) => makeCompanyConfig(n));
    discoverOpts = { companyConfigs: configs, companies, explicitCompanies: true, cap: limit };
  } else {
    // 今日循环模式：从全量名单按游标切片 DAILY_COMPANY_LIMIT 家，采完循环
    const all = await getAllListedCompanies();
    const total = all.length;
    if (total === 0) {
      console.log("[company] 名单为空，退出");
      runSession.set({ candidates: 0 });
      await runSession.finish("success");
      return;
    }
    const cursor = await readCursor();
    const start = cursor.index % total;
    const end = Math.min(start + DAILY_COMPANY_LIMIT, start + total); // 不超过一轮
    const sliceNames: string[] = [];
    for (let i = start; i < end; i++) sliceNames.push(all[(i % total)].name);
    // 本轮是否跨越末尾（需要循环到开头）
    const crossed = start + DAILY_COMPANY_LIMIT >= total;
    const newIndex = crossed ? (start + DAILY_COMPANY_LIMIT) % total : start + DAILY_COMPANY_LIMIT;
    const newRound = crossed ? cursor.round + 1 : cursor.round;

    todayCompanies = sliceNames;
    const configs = sliceNames.map((n) => makeCompanyConfig(n, undefined));
    discoverOpts = { companyConfigs: configs, companies: sliceNames, explicitCompanies: true, dailyCompanyLimit: DAILY_COMPANY_LIMIT };

    console.log(`[company] 今日循环模式：全量 ${total} 家，从第 ${start} 家起采 ${sliceNames.length} 家（round=${cursor.round}→${newRound}）`);
    // 先记录即将采集的游标（避免中途崩溃导致重复从头）
    await writeCursor({ index: newIndex, round: newRound, lastCompany: sliceNames[sliceNames.length - 1] });
  }

  const candidates = await discoverCandidates(discoverOpts);
  if (candidates.length === 0) {
    console.log("[company] 未发现候选案例");
    runSession.set({ candidates: 0 });
    await runSession.finish("success");
    return;
  }

  runSession.set({ candidates: candidates.length });

  const limited = limit ? candidates.slice(0, limit) : candidates;

  // URL 层预去重：已入库的 sourceUrl 直接跳过，避免对重复案例重复调用 deepseek（零 LLM 消耗拦截）。
  let prededupSkipped = 0;
  let toEnrich: Candidate[] = limited;
  if (writeDb || dryRun) {
    // dry-run 也走预查，便于在后台看到"今日新增"真实增量；仅当明确要写库或试跑时查库。
    const urls = limited.map((c) => c.url).filter(Boolean);
    const existing = await existingSourceUrls(urls);
    toEnrich = limited.filter((c) => !existing.has(normalizeSourceUrl(c.url)));
    prededupSkipped = limited.length - toEnrich.length;
    console.log(`[company] URL 预去重：候选 ${limited.length}，已存在 ${prededupSkipped}，待 LLM 抽取 ${toEnrich.length}`);
  }

  const enriched = await mapLimit(toEnrich, 2, async (c: Candidate) => enrichCandidate(c));

  const aiCases = enriched.filter((e) => e.caseStudy && !e.skipped).map((e) => e.caseStudy!);
  const skipped = enriched.filter((e) => e.skipped);
  const errors = enriched.filter((e) => e.skipped && (e.reason || "").includes("失败"));

  console.log(`[company] 抽取完成：候选 ${limited.length}，AI 案例 ${aiCases.length}，跳过 ${skipped.length}，失败 ${errors.length}`);

  const reportRaw = {
    triggeredAt: new Date().toISOString(),
    companies: todayCompanies.length,
    candidates: limited.length,
    prededupSkipped,
    aiCases: aiCases.length,
    skipped: skipped.length,
    errors: errors.length,
    created: 0,
    updated: 0,
    cases: aiCases.map((c) => ({ title: c.title, org: c.organization.name, url: c.sources?.[0]?.url })),
  };
  const reportPath = out || "/var/log/company-collect-report.json";
  try {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(reportRaw, null, 2));
  } catch (e: any) {
    console.warn(`[company] 写报告失败 ${reportPath}: ${e.message}`);
  }

  if (dryRun) {
    console.log("[company] dry-run 完成，不写库");
    runSession.inc({ aiCases: aiCases.length, skipped: skipped.length, failed: errors.length, prededup: prededupSkipped });
    await runSession.finish();
    return;
  }

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
  console.log(`[company] 数据库写入完成：新建 ${created}，更新（去重）${updated}`);

  runSession.inc({ aiCases: aiCases.length, skipped: skipped.length, failed: errors.length, created, updated, prededup: prededupSkipped });
  await runSession.finish();
}

run().catch((err) => {
  console.error(err);
  runSession?.fail(err).finally(() => process.exit(1));
});
