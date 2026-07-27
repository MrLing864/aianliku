import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";
import { writeFileSync } from "fs";

dotenv.config();
const app = tcb.init({
  env: process.env.CLOUDBASE_ENV!,
  secretId: process.env.CLOUDBASE_SECRET_ID!,
  secretKey: process.env.CLOUDBASE_SECRET_KEY!,
});
const db = app.database();

(async () => {
  const coll = db.collection("cases");
  // 缺失的两类目标，补零后去查真实主案例
  const missingPrefixes = [
    "case-kefu-2024-",   // 1..9 缺，应映射到 -01..-09
    "case-top30-2024-",  // 1..9 缺，应映射到 -01..-09
  ];
  let report = "";
  for (const p of missingPrefixes) {
    for (let i = 1; i <= 9; i++) {
      const wrong = p + i;            // mergedIntoSlug 里写的
      const right = p + String(i).padStart(2, "0"); // 真实主案例
      const hit = await coll.where({ slug: right }).field({ slug: true, contentStatus: true, title: true }).get();
      const d = (hit.data as any[])[0];
      report += `${wrong}  ->  ${right}: ${d ? `EXISTS status=${d.contentStatus} title="${d.title || ""}"` : "NOT FOUND"}\n`;
    }
  }
  writeFileSync("collectors/check-merged3.out", report, "utf8");
})().catch((e) => {
  writeFileSync("collectors/check-merged3.out", "ERR " + (e?.message || e));
  process.exit(1);
});
