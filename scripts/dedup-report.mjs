// 只读：统计 cases 集合中按「新 dedupKey」分组的重复规模，以及缺 sourceUrl 的记录数。
// 不执行任何删除/写入操作，仅供诊断。
import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";

dotenv.config();

// 内联归一化（与 collectors/lib/normalize.ts 保持一致，避免 tsx 依赖链解析问题）
function normalizeTitle(title) {
  return (title || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(20[12]\d年?)/g, "").replace(/(典型案例|应用案例|优秀案例|人工智能|ai|\d+个)/gi, "").trim();
}
function normalizeCompany(name) {
  return (name || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "").trim();
}
function normalizeSourceUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let path = decodeURIComponent(u.pathname).toLowerCase();
    path = path.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").replace(/[?#].*$/, "");
  }
}

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});
const db = app.database();
const coll = db.collection("cases");

// 复刻 normalize.ts 的 buildDedupKey（新版：有 URL 用 url+dedupTitle+year，无 URL 回退 title+company+summaryHash+year）
const DEDUP_STOPWORDS = ["平台","方案","系统","智慧","一体化","协同","基于","借助","通过","实现","打造","助力","以","的","了","ai","数字化","转型","驱动","智能","一站式","案例","应用","典型","优秀","：",":","—","-","～","~"];
function normalizeDedupTitle(title) {
  let t = (title || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(20[12]\d年?)/g, "");
  for (const w of DEDUP_STOPWORDS) t = t.split(w).join("");
  return t.trim();
}
function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
function newDedupKey(rec) {
  const title = rec.title || "";
  const company = (rec.organization && rec.organization.name) || "";
  const year = (rec.publishedAt || rec.updatedAt || "").slice(0, 4) || "";
  const rawUrl = (rec.sources && rec.sources[0] && rec.sources[0].url) || rec.sourceUrl || "";
  const url = normalizeSourceUrl(rawUrl);
  if (url) return `${url}__${normalizeDedupTitle(title)}__${year}`;
  const summary = (rec.summary || "").replace(/\s+/g, "").slice(0, 120);
  const sHash = summary ? hashString(summary) : "";
  return `${normalizeTitle(title)}__${normalizeCompany(company)}__${sHash}__${year}`;
}

async function main() {
  const groups = new Map();
  const missingSource = [];
  let total = 0;
  const PAGE = 1000;

  const cnt = await coll.count();
  const n = cnt.total || 0;
  for (let i = 0; i < n; i += PAGE) {
    const res = await coll
      .field({ _id: true, title: true, summary: true, sourceUrl: true, sources: true, organization: true, publishedAt: true, updatedAt: true })
      .skip(i)
      .limit(PAGE)
      .get();
    const data = res.data || [];
    for (const rec of data) {
      total++;
      const rawUrl = (rec.sources && rec.sources[0] && rec.sources[0].url) || rec.sourceUrl || "";
      if (!normalizeSourceUrl(rawUrl)) missingSource.push(rec._id);
      const k = newDedupKey(rec);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(rec._id);
    }
  }

  let duplicateGroups = 0;
  let duplicateRecords = 0;
  const examples = [];
  for (const [k, ids] of groups) {
    if (ids.length > 1) {
      duplicateGroups++;
      duplicateRecords += ids.length - 1;
      if (examples.length < 10) examples.push({ key: k, ids });
    }
  }

  console.log("=== 重复采集诊断报告（只读）===");
  console.log("总记录数:", total);
  console.log("缺 sourceUrl（归一化后为空）记录数:", missingSource.length);
  console.log("按新 dedupKey 分组的重复组数:", duplicateGroups);
  console.log("可清理的重复记录数（每组保留1条）:", duplicateRecords);
  console.log("重复示例（前10组）:");
  for (const ex of examples) {
    console.log("  dedupKey:", ex.key);
    console.log("    _ids:", ex.ids.join(", "));
  }

  // 玲珑轮胎专项核查
  const lingLong = await coll.where({ title: db.RegExp({ regexp: "玲珑", options: "i" }) }).field({ _id: true, title: true, sourceUrl: true, sources: true, dedupKey: true, publishedAt: true, updatedAt: true }).get();
  console.log("\n=== 玲珑轮胎专项 ===");
  console.log("命中记录数:", (lingLong.data || []).length);
  for (const r of lingLong.data || []) {
    const rawUrl = (r.sources && r.sources[0] && r.sources[0].url) || r.sourceUrl || "";
    console.log("  _id:", r._id, "| title:", r.title, "| sourceUrl:", normalizeSourceUrl(rawUrl) || "(空)", "| 库内dedupKey:", r.dedupKey || "(无)");
  }

  // 朗镜同页多案例核查：是否存在同一 sourceUrl 对应多条不同标题记录
  const langJing = await coll.where({ title: db.RegExp({ regexp: "朗镜", options: "i" }) }).field({ _id: true, title: true, sourceUrl: true, sources: true }).get();
  console.log("\n=== 朗镜专项（验证同页多案例是否共享URL）===");
  const urlGroups = new Map();
  for (const r of langJing.data || []) {
    const rawUrl = (r.sources && r.sources[0] && r.sources[0].url) || r.sourceUrl || "";
    const u = normalizeSourceUrl(rawUrl) || "(空)";
    if (!urlGroups.has(u)) urlGroups.set(u, []);
    urlGroups.get(u).push(r.title);
  }
  for (const [u, titles] of urlGroups) {
    console.log(`  sourceUrl=${u} → ${titles.length} 条:`, titles.join(" | "));
  }
}

main().catch((e) => {
  console.error("报告失败:", e);
  process.exit(1);
});
