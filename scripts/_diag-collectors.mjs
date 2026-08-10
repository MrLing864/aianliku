/**
 * 临时诊断脚本：验证修复后的归一化逻辑能否正确还原统计。用完即删。
 */
import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});
const db = app.database();

const EMPTY = { candidates: 0, aiCases: 0, success: 0, created: 0, updated: 0, failed: 0, skipped: 0 };

// 与 src/lib/repositories/admin.ts 的 normalizeRunRecord 保持一致
function normalize(raw) {
  const nested = raw.data && typeof raw.data === "object" ? raw.data : {};
  const rawCounts = raw.counts ?? nested.counts;
  const counts = { ...EMPTY };
  if (rawCounts && typeof rawCounts === "object") {
    for (const k of Object.keys(EMPTY)) {
      if (typeof rawCounts[k] === "number") counts[k] = rawCounts[k];
    }
  }
  if (counts.success === 0 && counts.created + counts.updated > 0) {
    counts.success = counts.created + counts.updated;
  }
  return {
    runId: raw.runId ?? raw._id,
    category: raw.category,
    categoryName: raw.categoryName,
    sourceName: raw.sourceName,
    triggeredAt: raw.triggeredAt,
    status: nested.status ?? raw.status ?? "running",
    counts,
  };
}

const res = await db.collection("collector_runs").orderBy("triggeredAt", "desc").limit(500).get();
const runs = res.data.map(normalize);

// 模拟页面渲染：访问每个字段，确认不会抛错
let rendered = 0;
for (const r of runs) {
  const c = r.counts || EMPTY;
  void `${r.sourceName}${r.categoryName}${c.candidates}${c.aiCases}${c.success}${c.created}${c.updated}${c.failed}${c.skipped}`;
  rendered++;
}
console.log("✅ 模拟渲染全部记录成功，无异常。渲染条数:", rendered);

console.log("\n状态分布（修复后）:");
const st = {};
for (const r of runs) st[r.status] = (st[r.status] || 0) + 1;
console.log(st);

// 按天 × 分类聚合
const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${`${x.getMonth() + 1}`.padStart(2, "0")}-${`${x.getDate()}`.padStart(2, "0")}`;
};
const bucket = new Map();
const since = new Date(Date.now() - 30 * 86400000);
for (const r of runs) {
  const t = new Date(r.triggeredAt);
  if (Number.isNaN(t.getTime()) || t < since) continue;
  const key = `${ymd(t)}__${r.category}`;
  const cur = bucket.get(key) || { date: ymd(t), category: r.category, success: 0, failed: 0, dedup: 0, runs: 0 };
  cur.success += r.counts.success;
  cur.failed += r.counts.failed;
  cur.dedup += r.counts.updated;
  cur.runs += 1;
  bucket.set(key, cur);
}
const rows = Array.from(bucket.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
console.log("\n按天×分类统计（前 10 行，修复后应有非零值）:");
console.table(rows.slice(0, 10));

const totals = rows.reduce((a, r) => ({ success: a.success + r.success, failed: a.failed + r.failed, dedup: a.dedup + r.dedup, runs: a.runs + r.runs }), { success: 0, failed: 0, dedup: 0, runs: 0 });
console.log("\n30天合计:", totals);

process.exit(0);
