// 把本地 cases_json/*.json 中各来源的 originalUrl 同步进 CloudBase cases 集合的 sources[].url。
// 仅补充/修正 sources 数组里每条来源的 url 字段，保留 sources 其它字段及文档其它字段（含 views）。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

const CASES_DIR = join(process.cwd(), "cases_json");
const files = readdirSync(CASES_DIR)
  .filter((f) => f.startsWith("case-2025-") && f.endsWith(".json"))
  .sort();

console.log(`[sync] 读取到 ${files.length} 个本地案例文件`);

let updated = 0;
let unchanged = 0;
let missingInDb = 0;
let withUrl = 0;
let withoutUrl = 0;

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(CASES_DIR, f), "utf-8"));
  const id = raw.id || f.replace(/\.json$/, "");
  const rawSources = Array.isArray(raw.sources) ? raw.sources : [];

  const r = await coll.where({ slug: id }).field({ sources: true }).limit(1).get();
  const doc = r && r.data && r.data[0];
  if (!doc) {
    missingInDb += 1;
    console.warn(`[sync] 数据库缺少 slug=${id}（文件 ${f}）`);
    continue;
  }

  const dbSources = Array.isArray(doc.sources) ? doc.sources : [];
  let changed = false;
  const newSources = dbSources.map((src, i) => {
    const orig = rawSources[i];
    const originalUrl = (orig && (orig.originalUrl || orig.url)) || undefined;
    if (originalUrl && src.url !== originalUrl) {
      changed = true;
      return { ...src, url: originalUrl };
    }
    return src;
  });

  if (changed) {
    await coll.where({ slug: id }).update({ sources: newSources });
    updated += 1;
  } else {
    unchanged += 1;
  }

  for (const s of newSources) {
    if (s.url) withUrl += 1;
    else withoutUrl += 1;
  }
}

console.log(`[sync] 完成：更新 ${updated} 条，未变化 ${unchanged} 条，数据库缺失 ${missingInDb} 条`);
console.log(`[sync] 同步后来源 url 统计：有链接 ${withUrl} 条，无链接 ${withoutUrl} 条`);
process.exit(0);
