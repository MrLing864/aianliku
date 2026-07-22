import { readFileSync } from "node:fs";
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

const validOutcome = new Set(["success", "partial", "failure", "undisclosed"]);
const validConfidence = new Set(["high", "medium", "pending"]);

async function main() {
  const total = await coll.where({ contentStatus: "published" }).count();
  console.log(`Scanning ${total.total} cases...`);

  let fixed = 0;

  const PAGE = 50;
  for (let p = 1; (p - 1) * PAGE < total.total; p++) {
    const res = await coll.where({ contentStatus: "published" })
      .skip((p - 1) * PAGE).limit(PAGE).get();

    for (const d of res.data ?? []) {
      let needFix = false;
      const os = d.outcomeStatus;
      const cf = d.confidence;

      if (!os || !validOutcome.has(os)) {
        console.log(`  FIX outcomeStatus: ${d.slug} [${os}] → undisclosed`);
        needFix = true;
      }
      if (!cf || !validConfidence.has(cf)) {
        console.log(`  FIX confidence: ${d.slug} [${cf}] → pending`);
        needFix = true;
      }

      if (needFix) {
        await coll.where({ slug: d.slug }).update({
          ...((!os || !validOutcome.has(os)) ? { outcomeStatus: "undisclosed" } : {}),
          ...((!cf || !validConfidence.has(cf)) ? { confidence: "pending" } : {}),
        });
        fixed++;
      }
    }
  }

  console.log(`\nFixed ${fixed} cases`);
}

main().catch(console.error);
