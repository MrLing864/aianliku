/**
 * 政府机关 AI 应用案例定时采集入口。
 *
 * 用法：
 *   tsx collectors/government/run.ts [--write-db] [--dry-run] [--limit=N] [--provinces=广东,江苏]
 *
 * 每日 3 点由 Lighthouse crontab 调用，建议：
 *   0 3 * * * cd /root/aianliku_20260727103648/collectors && /usr/bin/node ../node_modules/.bin/tsx government/run.ts --write-db >> /var/log/gov-collect.log 2>&1
 *
 * 流程：discover(按省份搜索) → 预去重(existingDedupKeys) → enrich(抓取+抽取+补采+点评) → upsert。
 */

import { discoverCandidates } from "./discover";
import { enrichCandidate } from "./enrich";
import { mapLimit } from "../lib/fetch";

// 本地 sleep / canFetch，避免从 ../lib/fetch 静态导入在某些 ESM 解析下绑定为 undefined
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// robots.txt 合规检查（本地实现，尽力而为；解析失败默认允许抓取）
async function canFetch(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const txt = await (await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) })).text();
    const lines = txt.split(/\r?\n/);
    let agentMatch = false;
    const disallow: string[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (/^user-agent:/i.test(line)) {
        agentMatch = /user-agent:\s*\*/i.test(line) || /user-agent:\s*tsx|bot/i.test(line);
      } else if (/^disallow:/i.test(line) && agentMatch) {
        const p = line.split(/:\s*/, 2)[1]?.trim();
        if (p) disallow.push(p);
      }
    }
    const path = u.pathname + u.search;
    return !disallow.some((p) => p !== "/" && path.startsWith(p));
  } catch {
    return true;
  }
}
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";
import { startRun, type RunLogSession } from "../lib/runlog";

function parseArgs() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0", 10) || undefined;
  const dryRun = args.includes("--dry-run");
  const writeDb = args.includes("--write-db");
  const provinces = args.find((a) => a.startsWith("--provinces="))?.split("=")[1]?.split(",").map((s) => s.trim()).filter(Boolean);
  const out = args.find((a) => a.startsWith("--out="))?.split("=")[1];
  return { limit, dryRun, writeDb, provinces, out };
}

// 顶层 session 作用域，便于 run().catch 在崩溃时也能标记失败
let runSession: RunLogSession | null = null;

async function run() {
  const { limit, dryRun, writeDb, provinces, out } = parseArgs();

  // 开启运行记录（定时器触发，来源=政府机关）
  runSession = startRun("government", "gov", "政府机关", writeDb ? "cron" : "manual");

  console.log(`[gov] 开始采集（writeDb=${writeDb}, limit=${limit ?? "∞"}, provinces=${provinces?.join("/") ?? "全部"}）`);

  const candidates = await discoverCandidates({ provinces, cap: limit });
  if (candidates.length === 0) {
    console.log("[gov] 未发现候选案例");
    runSession.set({ candidates: 0 });
    await runSession.finish("success");
    return;
  }

  // 预去重（V2）：由后台统一去重服务做精确幂等，此处仅用归一化 sourceUrl 轻量跳过明显重复，避免重复 LLM 消耗。
  let toProcess = candidates;
  if (writeDb) {
    const { existingSourceUrls } = await import("../lib/cloudbase");
    const existing = await existingSourceUrls(candidates.map((c) => c.sourceUrl).filter(Boolean));
    const before = toProcess.length;
    toProcess = candidates.filter((c) => !existing.has(c.sourceUrl));
    console.log(`[gov] 预去重：跳过 ${before - toProcess.length} 条已存在来源，剩余 ${toProcess.length}`);
  }

  const limited = limit ? toProcess.slice(0, limit) : toProcess;
  runSession.set({ candidates: limited.length });

  const aiCases: any[] = [];
  const skipped: { url: string; reason: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  await mapLimit(limited, 3, async (cand) => {
    // 合规抓取：随机 1~3 秒间隔，降低被目标站封禁风险
    await sleep(1000 + Math.floor(Math.random() * 2000));
    // robots.txt 合规：被目标站禁止抓取的 URL 直接跳过
    if (!(await canFetch(cand.url))) {
      console.log(`[gov] robots.txt 禁止抓取，跳过：${cand.url}`);
      skipped.push({ url: cand.url, reason: "robots.txt 禁止" });
      return;
    }
    console.log(`[gov] 处理：${cand.province} - ${cand.title} (${cand.url})`);
    try {
      const result = await enrichCandidate(cand);
      if (result.skipped) {
        skipped.push({ url: cand.url, reason: result.reason || "跳过" });
        return;
      }
      if (result.caseStudy) {
        aiCases.push(result.caseStudy);
        console.log(`[gov] 保留：${result.caseStudy.organization.name} - ${result.caseStudy.title}`);
      }
    } catch (err: any) {
      errors.push({ url: cand.url, error: err.message || String(err) });
      console.error(`[gov] 失败 ${cand.url}:`, err.message || err);
    }
  });

  console.log(`\n[gov] 完成：候选 ${limited.length}，入库案例 ${aiCases.length}，跳过 ${skipped.length}，错误 ${errors.length}`);

  if (out) {
    const payload = {
      meta: { collectedAt: new Date().toISOString(), candidates: limited.length, aiCases: aiCases.length, skipped: skipped.length, errors: errors.length },
      cases: aiCases,
      skipped,
      errors,
    };
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(payload, null, 2));
    console.log(`[gov] 已写入文件: ${out}`);
  }

  if (dryRun || !writeDb) {
    if (!out) console.log("[gov] 未指定 --out 且非 --write-db，仅输出统计。");
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
      console.log(`[db] 入库成功：${c.organization?.name || "<未知>"} - ${c.title}`);
    } catch (err: any) {
      errors.push({ url: c.sources?.[0]?.url || "", error: err.message || String(err) });
      console.error(`[db] 入库失败：${err.message || err}`);
    }
  }
  console.log(`[gov] 数据库写入完成：新建 ${created}，更新 ${updated}`);

  // 记录汇总计数到运行日志
  runSession.inc({
    aiCases: aiCases.length,
    skipped: skipped.length,
    failed: errors.length,
    created,
    updated,
  });
  await runSession.finish();

  // 统计报告：置信度分布 + 待人工补充占比（补全成功率）
  const confidenceDist: Record<string, number> = { high: 0, medium: 0, pending: 0 };
  let pendingCases = 0;
  for (const c of aiCases) {
    const conf = String(c.confidence || "pending");
    confidenceDist[conf] = (confidenceDist[conf] || 0) + 1;
    if (conf === "pending") pendingCases++;
  }
  const enrichSuccessRate = aiCases.length ? ((aiCases.length - pendingCases) / aiCases.length) * 100 : 0;

  const report = {
    collectedAt: new Date().toISOString(),
    args: { writeDb, dryRun, limit: limit ?? null, provinces: provinces ?? null },
    candidates: limited.length,
    aiCases: aiCases.length,
    skipped: skipped.length,
    errors: errors.length,
    db: { created, updated },
    enrichSuccessRatePct: Number(enrichSuccessRate.toFixed(1)),
    confidenceDist,
    pendingCases,
  };
  console.log(`\n[gov] 统计报告：${JSON.stringify(report)}`);

  // 报告落盘（复用日志目录，crontab 已重定向 stdout 到 /var/log/gov-collect.log）
  const reportPath = "/var/log/gov-collect-report.json";
  try {
    const line = JSON.stringify(report);
    writeFileSync(reportPath, line);
  } catch {
    // 本地/无权限时忽略落盘失败，不影响主流程
  }
}

run().catch((err) => {
  console.error(err);
  // 崩溃也标记失败，保证后台可见
  runSession?.fail(err).finally(() => process.exit(1));
});
