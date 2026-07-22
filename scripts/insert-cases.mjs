import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

const LOG = join(process.cwd(), "scripts/insert-run.log");
appendFileSync(LOG, `\n=== RUN ${new Date().toISOString()} ===\n`);

process.on("unhandledRejection", (r) => { appendFileSync(LOG, `REJECT ${r}\n`); process.exit(3); });

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
appendFileSync(LOG, `env=${process.env.CLOUDBASE_ENV}\n`);

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

const JSON_PATH = process.argv[2] || "scripts/extracted/beijing-2023-cases.json";
appendFileSync(LOG, `Using JSON: ${JSON_PATH}\n`);

async function main() {
  const cases = JSON.parse(readFileSync(join(process.cwd(), JSON_PATH), "utf-8"));
  appendFileSync(LOG, `Loaded ${cases.length} cases\n`);

  let inserted = 0, skipped = 0, failed = 0;
  for (const c of cases) {
    const exist = await coll.where({ title: c.title }).count();
    if (exist.total > 0) {
      appendFileSync(LOG, `SKIP ${c.slug}\n`);
      skipped++;
      continue;
    }
    try {
      await coll.add(c);
      appendFileSync(LOG, `INSERT ${c.slug}\n`);
      inserted++;
    } catch (e) {
      appendFileSync(LOG, `FAIL ${c.slug} ${e && e.message}\n`);
      failed++;
    }
  }
  appendFileSync(LOG, `Done inserted=${inserted} skipped=${skipped} failed=${failed}\n`);
}

main().catch((e) => { appendFileSync(LOG, `MAIN ERR ${e}\n`); process.exit(2); });
