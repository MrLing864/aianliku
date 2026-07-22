// 将本地 cases_json/*.json 中已更新的 organization.size 同步进 CloudBase cases 集合。
// 仅更新 organization.size 字段，不重建文档、不重置 views 等其它字段。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

// 加载 .env（CLOUDBASE_* 等）
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
const dist = {};

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(CASES_DIR, f), "utf-8"));
  const id = raw.id || f.replace(/\.json$/, "");
  const size = (raw.organization && raw.organization.size) || "未披露";

  // 取数据库中的现有文档（只取 organization 用于对比）
  const r = await coll.where({ slug: id }).field({ organization: true }).limit(1).get();
  const doc = r && r.data && r.data[0];
  if (!doc) {
    missingInDb += 1;
    console.warn(`[sync] 数据库缺少 slug=${id}（文件 ${f}）`);
    continue;
  }

  const curSize = (doc.organization && doc.organization.size) || "未披露";
  if (curSize === size) {
    unchanged += 1;
    dist[size] = (dist[size] || 0) + 1;
    continue;
  }

  // 保留 organization 其它字段，仅改 size
  const newOrg = { ...(doc.organization || {}), size };
  await coll.where({ slug: id }).update({ organization: newOrg });
  updated += 1;
  dist[size] = (dist[size] || 0) + 1;
}

console.log(`[sync] 完成：更新 ${updated} 条，未变化 ${unchanged} 条，数据库缺失 ${missingInDb} 条`);
console.log("[sync] 同步后人数规模分布:", JSON.stringify(dist));
process.exit(0);
