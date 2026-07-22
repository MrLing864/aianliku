// 检查哪些 PDF 尚未 OCR + 数据库中已有多少案例
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

// 加载 .env
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

const REPORT_DIR = join(process.cwd(), "report");
const OCR_DIR = join(process.cwd(), "report_ocr");

const reports = readdirSync(REPORT_DIR).filter(f => f.endsWith(".pdf"));
const ocrFiles = new Set(readdirSync(OCR_DIR).filter(f => f.endsWith(".done")).map(f => f.replace(".done", "")));

console.log("=== 未OCR的PDF ===");
let needOcr = [];
for (const f of reports) {
  if (!ocrFiles.has(f)) {
    needOcr.push(f);
    console.log("  MISSING:", f);
  }
}
console.log(`\n需要OCR: ${needOcr.length} / 总共: ${reports.length}\n`);

// 统计数据库
console.log("=== 数据库状态 ===");
const total = await coll.where({}).count();
console.log(`总案例数: ${total.total}`);

// 按 source 分组统计
const published = await coll.where({ contentStatus: "published" }).count();
console.log(`已发布: ${published.total}`);

// 列出所有唯一的 source title
const allPublished = await coll.where({ contentStatus: "published" }).field({ title: true, "sources.title": true }).limit(1000).get();
const sourceTitles = new Set();
for (const d of allPublished.data) {
  if (d.sources && d.sources.length) {
    for (const s of d.sources) {
      if (s.title) sourceTitles.add(s.title);
    }
  }
}

console.log(`\n已入库的案例来源报告 (${sourceTitles.size} 个):`);
for (const t of [...sourceTitles].sort()) {
  console.log(`  - ${t}`);
}
