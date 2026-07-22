// 查哪些报告已生成过案例 JSON
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const JSON_DIR = join(process.cwd(), "cases_json");
const files = readdirSync(JSON_DIR).filter(f => f.endsWith(".json"));

// 读取所有json文件，提取source title
const reportCases = {};
for (const f of files) {
  const data = JSON.parse(readFileSync(join(JSON_DIR, f), "utf-8"));
  if (data.slug && data.slug.startsWith("case-report-")) {
    const src = data.sources?.[0]?.title || "unknown";
    if (!reportCases[src]) reportCases[src] = [];
    reportCases[src].push({ slug: data.slug, title: data.title });
  }
}

const reportTitles = Object.keys(reportCases);
console.log(`来自报告的案例: ${reportTitles.length} 个报告\n`);
for (const [rt, cases] of Object.entries(reportCases).sort()) {
  console.log(`${rt}: ${cases.length} 条`);
  for (const c of cases) {
    console.log(`  - ${c.slug}: ${c.title}`);
  }
  console.log();
}
