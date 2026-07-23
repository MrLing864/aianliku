import { readFileSync, existsSync } from "node:fs";
import cloudbase from "@cloudbase/node-sdk";

console.log("START env-exists=", existsSync(".env"));

try {
  const envText = readFileSync(".env", "utf-8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
  console.log("ENV CLOUDBASE_ENV=", process.env.CLOUDBASE_ENV, "SID?", Boolean(process.env.CLOUDBASE_SECRET_ID));

  const app = cloudbase.init({
    env: process.env.CLOUDBASE_ENV,
    secretId: process.env.CLOUDBASE_SECRET_ID,
    secretKey: process.env.CLOUDBASE_SECRET_KEY,
    region: process.env.CLOUDBASE_REGION || "ap-shanghai",
  });
  const db = app.database();
  const agg = db.command.aggregate;
  const coll = db.collection("cases");

  const total = await coll.count();
  console.log("TOTAL_DOCS", total.total);

  const byStatus = await coll.aggregate().group({ _id: "$contentStatus", count: agg.sum(1) }).end();
  console.log("BY_STATUS", JSON.stringify(byStatus.data));

  const ind = await coll.aggregate().group({ _id: "$industry.slug" }).end();
  console.log("INDUSTRIES_ALL", ind.data.length);

  const scn = await coll.aggregate().unwind("$scenarios").group({ _id: "$scenarios.slug" }).end();
  console.log("SCENARIOS_ALL", scn.data.length);

  const src = await coll.aggregate().group({ _id: null, total: agg.sum(agg.size("$sources")) }).end();
  console.log("SOURCES_SUM_ALL", JSON.stringify(src.data));
} catch (e) {
  console.log("ERR", e && e.message, e && e.stack);
}
console.log("DONE");
