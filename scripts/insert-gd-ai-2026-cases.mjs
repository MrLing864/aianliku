import { readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

process.on("unhandledRejection", (r) => { console.error("REJECT", r); process.exit(3); });

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
const coll = app.database().collection("cases");

const cases = JSON.parse(readFileSync(join(process.cwd(), "scripts/extracted/gd-ai-2026-cases.json"), "utf-8"));

const DRY = process.argv.includes("--dry");

async function main() {
  console.log(`准备插入 ${cases.length} 条案例${DRY ? "（DRY RUN）" : ""}`);
  let inserted = 0, skipped = 0;

  for (const c of cases) {
    // 1) slug 去重
    const bySlug = await coll.where({ slug: c.slug }).count();
    if (bySlug.total > 0) {
      console.log(`SKIP(slug) ${c.slug}`);
      skipped++;
      continue;
    }
    // 2) 标题去重（防止同项目不同 slug）
    const byTitle = await coll.where({ title: c.title }).count();
    if (byTitle.total > 0) {
      console.log(`SKIP(title) ${c.slug} | ${c.title}`);
      skipped++;
      continue;
    }

    if (DRY) {
      console.log(`WOULD INSERT ${c.slug} | ${c.industry.displayName} / ${c.scenarios[0].name} | ${c.title}`);
      inserted++;
      continue;
    }

    const res = await coll.add(c);
    console.log(`OK ${c.slug} -> ${res.id}`);
    inserted++;
  }

  console.log(`\n完成：新增 ${inserted}，跳过 ${skipped}`);
  const total = await coll.count();
  console.log(`cases 集合当前总数：${total.total}`);
}

main().catch((e) => { console.error("MAIN ERR", e); process.exit(2); });
