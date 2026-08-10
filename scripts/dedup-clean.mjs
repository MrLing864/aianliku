// 重复采集清理：按新 buildDedupKey 分组，每组保留 updatedAt 最大的一条，删除其余；
// 同时给缺 sourceUrl 的记录回填归一化 sourceUrl（用于未来稳定去重）。
// 安全策略：默认 dry-run（仅打印），设置环境变量 CONFIRM_DELETE=yes 才真正删除。
import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});
const db = app.database();
const coll = db.collection("cases");

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
function normalizeTitle(title) {
  return (title || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(20[12]\d年?)/g, "").replace(/(典型案例|应用案例|优秀案例|人工智能|ai|\d+个)/gi, "").trim();
}
function normalizeCompany(name) {
  return (name || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "").trim();
}
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

const CONFIRM = process.env.CONFIRM_DELETE === "yes";
console.log(CONFIRM ? "【执行模式】将真正删除重复记录" : "【预演模式】仅打印，不删除。设置 CONFIRM_DELETE=yes 才执行删除");

async function main() {
  const groups = new Map();
  const needSourceBackfill = [];
  let total = 0;
  const cnt = await coll.count();
  const n = cnt.total || 0;
  const PAGE = 1000;
  for (let i = 0; i < n; i += PAGE) {
    const res = await coll.skip(i).limit(PAGE).get();
    for (const rec of res.data || []) {
      total++;
      const rawUrl = (rec.sources && rec.sources[0] && rec.sources[0].url) || rec.sourceUrl || "";
      const normUrl = normalizeSourceUrl(rawUrl);
      // 回填：库内缺顶层 sourceUrl 字段（或为空）但有 sources[0].url 的
      if (normUrl && (!rec.sourceUrl || normalizeSourceUrl(rec.sourceUrl) !== normUrl)) {
        needSourceBackfill.push({ _id: rec._id, sourceUrl: normUrl });
      }
      const k = newDedupKey(rec);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(rec);
    }
  }

  let toDelete = [];
  for (const [k, recs] of groups) {
    if (recs.length > 1) {
      recs.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      const keep = recs[0];
      const dups = recs.slice(1);
      toDelete = toDelete.concat(dups.map((d) => ({ _id: d._id, keepId: keep._id, key: k })));
    }
  }

  console.log("总记录数:", total);
  console.log("需回填 sourceUrl 的记录数:", needSourceBackfill.length);
  console.log("待删除重复记录数:", toDelete.length);
  if (toDelete.length > 0) {
    console.log("待删除清单:");
    for (const d of toDelete) console.log(`  删除 ${d._id} （保留 ${d.keepId}） key=${d.key}`);
  }

  if (!CONFIRM) return;

  // 先回填 sourceUrl
  for (const b of needSourceBackfill) {
    await coll.doc(b._id).update({ data: { sourceUrl: b.sourceUrl } });
  }
  console.log(`已回填 ${needSourceBackfill.length} 条 sourceUrl`);

  // 再删除重复（谨慎：逐条删除并计数）
  let deleted = 0;
  for (const d of toDelete) {
    await coll.doc(d._id).remove();
    deleted++;
  }
  console.log(`已删除 ${deleted} 条重复记录`);
}

main().catch((e) => { console.error("清理失败:", e); process.exit(1); });
