import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

const LOG = join(process.cwd(), "scripts/insert-run.log");
appendFileSync(LOG, `\n=== UPDATE contentStatus ${new Date().toISOString()} ===\n`);

process.on("unhandledRejection", (r) => { appendFileSync(LOG, `REJECT ${r}\n`); process.exit(3); });

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
}

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

// titles of the 10 embodied-intelligence whitepaper cases (chapter 4)
const TITLES = [
  "智元机器人远征 A2-W 工业具身智能规模化部署",
  "银河通用 Galbot G1 具身智能无人便利店与无人药房",
  "微亿智造「创Tron」仿生视觉装配机器人",
  "Physical Intelligence Pi-Zero 零样本机械臂操控",
  "阿里云千问大模型驱动工业机器人",
  "自变量机器人 WALL-A 联合 58 到家落地智能保洁",
  "西安中科光电智能焊接机器人",
  "Figure AI Helix 零样本零售货架抓取",
  "达芬奇手术机器人临床应用",
  "STI 自主扫雷无人机野外排雷应用",
];

async function main() {
  let updated = 0, missing = 0, failed = 0;
  for (const title of TITLES) {
    try {
      const res = await coll.where({ title }).update({ contentStatus: "published" });
      const n = res.updated || 0;
      if (n > 0) { appendFileSync(LOG, `UPDATE "${title}" -> contentStatus=published (${n})\n`); updated++; }
      else { appendFileSync(LOG, `MISSING "${title}"\n`); missing++; }
    } catch (e) {
      appendFileSync(LOG, `FAIL "${title}" ${e && e.message}\n`);
      failed++;
    }
  }
  appendFileSync(LOG, `Done updated=${updated} missing=${missing} failed=${failed}\n`);
  console.log(`updated=${updated} missing=${missing} failed=${failed}`);
}

main().catch((e) => { appendFileSync(LOG, `MAIN ERR ${e}\n`); process.exit(2); });
