import { fetchHtml, discoverUrls as regexDiscoverUrls, mapLimit } from "./lib/fetch";
import { extractTencentList, classifyAICase, extractCaseDetail, extractCustomerDetailText, type RawListItem } from "./lib/extract";
import { normalizeCase, type CaseStudy } from "./lib/normalize";
import { discoverAliyunListItems, extractAliyunDetailText, extractAliyunMeta } from "./lib/aliyun";
import { vendors } from "./vendors";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { startRun, type RunLogSession } from "./lib/runlog";

function parseArgs() {
  const args = process.argv.slice(2);
  const vendor = args.find((a) => a.startsWith("--vendor="))?.split("=")[1] || "tencent";
  const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0", 10) || undefined;
  const dryRun = args.includes("--dry-run");
  const out = args.find((a) => a.startsWith("--out="))?.split("=")[1];
  const writeDb = args.includes("--write-db");
  return { vendor, limit, dryRun, out, writeDb };
}

// 顶层 session 作用域，便于 run().catch 在崩溃时也能标记失败
let runSession: RunLogSession | null = null;

async function run() {
  const { vendor: vendorId, limit, dryRun, out, writeDb } = parseArgs();
  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    console.error(`未知 vendor: ${vendorId}`);
    process.exit(1);
  }
  if (!vendor.enabled) {
    console.log(`vendor ${vendorId} 已禁用: ${vendor.note}`);
    return;
  }

  // 开启运行记录（定时器触发）
  runSession = startRun("internet_giant", vendor.id, vendor.name, "cron");
  runSession.set({ candidates: 0 });

  console.log(`[run] 开始采集 ${vendor.name} (${vendor.listUrl})`);
  const listRes = await fetchHtml(vendor.listUrl);
  const baseUrl = listRes.finalUrl;

  let rawItems: RawListItem[] = [];
  if (vendor.discoverListItems) {
    // 富列表发现（如阿里云：需 JS 渲染筛选），直接返回带元数据的列表项
    rawItems = await vendor.discoverListItems();
  } else if (vendor.discoverUrls) {
    const urls = await vendor.discoverUrls(listRes.html, baseUrl);
    rawItems = urls.map((url) => ({
      sourceUrl: url,
      companyName: "",
      title: "",
      rawIndustry: "",
      summary: "",
    }));
    // 腾讯云列表页同时包含更丰富的元数据
    if (vendorId === "tencent") {
      const listItems = extractTencentList(listRes.html, baseUrl);
      const byUrl = new Map(listItems.map((i) => [i.sourceUrl, i]));
      rawItems = rawItems.map((i) => ({ ...(byUrl.get(i.sourceUrl) || i) }));
    }
  } else if (vendor.detailPathPattern) {
    const urls = regexDiscoverUrls(listRes.html, vendor.detailPathPattern, baseUrl);
    rawItems = urls.map((url) => ({
      sourceUrl: url,
      companyName: "",
      title: "",
      rawIndustry: "",
      summary: "",
    }));
  }

  if (rawItems.length === 0) {
    console.log("[run] 未发现案例链接");
    runSession?.set({ candidates: 0 });
    await runSession?.finish("success");
    return;
  }

  console.log(`[run] 发现 ${rawItems.length} 个候选案例`);
  runSession?.set({ candidates: rawItems.length });

  const limitedItems = limit ? rawItems.slice(0, limit) : rawItems;

  let processed = 0;
  const aiCases: CaseStudy[] = [];
  const skipped: { url: string; reason: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  await mapLimit(limitedItems, 5, async (raw) => {
    processed++;
    console.log(`[run] [${processed}/${limitedItems.length}] ${raw.sourceUrl}`);
    try {
      const detailRes = await fetchHtml(raw.sourceUrl);

      // 厂商特定的详情抽取
      let detailText: string;
      let vendorName = "腾讯云";
      if (vendorId === "aliyun") {
        const meta = extractAliyunMeta(detailRes.html, raw.title);
        if (meta.title) raw.title = raw.title || meta.title;
        if (meta.rawIndustry) raw.rawIndustry = raw.rawIndustry || meta.rawIndustry;
        if (meta.companyName) raw.companyName = raw.companyName || meta.companyName;
        detailText = extractAliyunDetailText(detailRes.html);
        vendorName = "阿里云";
      } else {
        detailText = extractCustomerDetailText(detailRes.html);
      }

      const classification = await classifyAICase(raw, detailText, vendorName);
      if (!classification) {
        errors.push({ url: raw.sourceUrl, error: "AI 相关性判断失败" });
        return;
      }
      if (!classification.isAICase) {
        skipped.push({ url: raw.sourceUrl, reason: classification.aiRelevanceReason || "非 AI 案例" });
        console.log(`[run] 跳过非 AI 案例: ${raw.companyName} - ${classification.aiRelevanceReason}`);
        return;
      }
      const extracted = await extractCaseDetail(raw, detailText, vendorName);
      if (!extracted) {
        errors.push({ url: raw.sourceUrl, error: "LLM 抽取失败" });
        return;
      }
      // Ensure classification reason is carried over
      extracted.isAICase = classification.isAICase;
      extracted.aiRelevanceReason = classification.aiRelevanceReason;
      const normalized = normalizeCase(raw, extracted, vendorName);
      aiCases.push(normalized);
      console.log(`[run] 保留 AI 案例: ${normalized.organization.name} - ${normalized.title}`);
    } catch (err: any) {
      errors.push({ url: raw.sourceUrl, error: err.message || String(err) });
      console.error(`[run] 处理失败 ${raw.sourceUrl}:`, err.message || err);
    }
  });

  console.log(`\n[run] 完成：候选 ${limitedItems.length}，AI 案例 ${aiCases.length}，跳过 ${skipped.length}，错误 ${errors.length}`);

  // 记录汇总计数（处理阶段）
  runSession?.inc({ aiCases: aiCases.length, skipped: skipped.length, failed: errors.length });

  if (out) {
    const payload = {
      meta: {
        vendor: vendor.name,
        collectedAt: new Date().toISOString(),
        totalCandidates: limitedItems.length,
        aiCases: aiCases.length,
        skipped: skipped.length,
        errors: errors.length,
      },
      cases: aiCases,
      skipped,
      errors,
    };
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(payload, null, 2));
    console.log(`[run] 已写入文件: ${out}`);
  }

  if (dryRun || !writeDb) {
    if (!out) {
      console.log("[run] 未指定 --out 且非 --write-db，仅输出统计。");
    }
    return;
  }

  // Write to CloudBase
  const { upsertCase } = await import("./lib/cloudbase");
  let created = 0;
  let updated = 0;
  for (const c of aiCases) {
    try {
      const r = await upsertCase(c);
      if (r.created) created++;
      else updated++;
      console.log(`[db] 已入库: ${c.organization?.name || "<未知>"} - ${c.title}`);
    } catch (err: any) {
      console.error(`[db] 入库失败 ${c.organization?.name || "<未知>"}:`, err.message || err);
    }
  }
  console.log(`[run] 数据库写入完成：新建 ${created}，更新（去重）${updated}`);
  runSession?.inc({ created, updated });
  await runSession?.finish();
}

run().catch((err) => {
  console.error(err);
  // 崩溃也标记失败，保证后台可见
  runSession?.fail(err).finally(() => process.exit(1));
});
