import { readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

process.on("unhandledRejection", (r) => { console.error("REJECT", r); process.exit(3); });

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
console.log("SCRIPT START env=", process.env.CLOUDBASE_ENV);

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

const JSON_PATH = "scripts/extracted/beijing-2023-cases.json";

async function main() {
  console.log("MAIN START");
  const cases = JSON.parse(readFileSync(join(process.cwd(), JSON_PATH), "utf-8"));
  console.log(`Loaded ${cases.length} cases`);

  let inserted = 0, skipped = 0, failed = 0;
  for (const c of cases) {
    const exist = await coll.where({ title: c.title }).count();
    if (exist.total > 0) {
      console.log(`SKIP ${c.slug}`);
      skipped++;
      continue;
    }
    try {
      await coll.add(c);
      console.log(`INSERT ${c.slug}`);
      inserted++;
    } catch (e) {
      console.error(`FAIL ${c.slug} ${e.message}`);
      failed++;
    }
  }
  console.log(`Done inserted=${inserted} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => { console.error("MAIN ERR", e); process.exit(2); });
