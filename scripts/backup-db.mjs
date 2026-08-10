// 全量备份 CloudBase `cases` 集合到本地 JSON 文件。
// 设计意图：数据是最重要的资产。每天凌晨 6 点由 backup-db.sh (cron) 调用，
// 防止误删 / 误操作导致数据丢失（历史上曾误删 2078 条，无法 UNDO）。
//
// 用法（在 collector 镜像内执行，已挂载 .env）：
//   npx tsx scripts/backup-db.mjs
// 可选环境变量：
//   BACKUP_DIR   备份目录（默认 /app/backups）
//   BACKUP_KEEP  保留最近多少份（默认 30，超出删除最旧的）
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

// 加载 .env（与现有脚本保持一致的解析方式）
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf-8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const BACKUP_DIR = process.env.BACKUP_DIR || "/app/backups";
const BACKUP_KEEP = parseInt(process.env.BACKUP_KEEP || "3", 10);

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

const PAGE = 1000;

function ts() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  console.log(`[backup] 开始全量备份 cases 集合 @ ${new Date().toISOString()}`);

  const total = await coll.where({}).count();
  const totalCount = total.total;
  console.log(`[backup] 集合总文档数: ${totalCount}`);

  const all = [];
  let lastId = null;
  let fetched = 0;
  while (true) {
    let query = coll.where({});
    // 用 _id 游标分页，避免单次超过 1000 上限
    if (lastId) query = coll.where({ _id: db.command.gt(lastId) });
    const res = await query.orderBy("_id", "asc").limit(PAGE).get();
    const batch = res.data || [];
    if (batch.length === 0) break;
    all.push(...batch);
    fetched += batch.length;
    lastId = batch[batch.length - 1]._id;
    console.log(`[backup] 已拉取 ${fetched}/${totalCount}`);
    if (batch.length < PAGE) break;
  }

  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = ts();
  const file = join(BACKUP_DIR, `cases-${stamp}.json`);
  const payload = {
    exportedAt: new Date().toISOString(),
    count: all.length,
    collection: "cases",
    docs: all,
  };
  writeFileSync(file, JSON.stringify(payload));
  const sizeKB = Math.round(statSync(file).size / 1024);
  console.log(`[backup] 已写入 ${file} (${all.length} 条, ${sizeKB} KB)`);

  // 仅保留最近 BACKUP_KEEP 份
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("cases-") && f.endsWith(".json"))
    .sort(); // 文件名含时间戳，字典序即时间序
  const excess = files.length - BACKUP_KEEP;
  if (excess > 0) {
    const toRemove = files.slice(0, excess);
    for (const f of toRemove) {
      unlinkSync(join(BACKUP_DIR, f));
      console.log(`[backup] 清理过期备份: ${f}`);
    }
  }
  console.log(`[backup] 完成。当前保留备份 ${Math.min(files.length, BACKUP_KEEP)} 份。`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("[backup] 失败:", e && e.message, e && e.stack);
    process.exit(1);
  }
);
