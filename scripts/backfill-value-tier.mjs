// 回填所有已入库案例的 valueTier / valueScore（价值分级）。
// 用法：
//   node scripts/backfill-value-tier.mjs            # 仅更新缺失或变化的
//   node scripts/backfill-value-tier.mjs --force    # 强制全部重算重写
//   node scripts/backfill-value-tier.mjs --dry      # 只统计分布，不写入
//
// 价值分级逻辑见 scripts/value-tier.mjs（与 src/lib/value-tier.ts 保持一致）。

import { writeFileSync } from "node:fs";
import cloudbase from "@cloudbase/node-sdk";
import { computeValueTier } from "./value-tier.mjs";

const ENV = process.env.CLOUDBASE_ENV_ID || process.env.CLOUDBASE_ENV || process.env.TCB_ENV;
if (!ENV) {
  console.error("缺少环境变量 CLOUDBASE_ENV_ID / TCB_ENV");
  process.exit(1);
}
const SECRET_ID = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY;

const app = cloudbase.init({ env: ENV, secretId: SECRET_ID, secretKey: SECRET_KEY });
const db = app.database();
const coll = db.collection("cases");

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry");

async function main() {
  let skip = 0;
  const LIMIT = 100;
  let total = 0;
  let updated = 0;
  let skipped = 0;
  const dist = { extreme: 0, high: 0, medium: 0, low: 0, unknown: 0 };

  while (true) {
    const res = await coll.where({ contentStatus: "published" }).limit(LIMIT).skip(skip).get();
    const list = res.data || [];
    if (list.length === 0) break;
    total += list.length;

    for (const r of list) {
      const { tier, score } = computeValueTier(r);
      dist[tier] = (dist[tier] || 0) + 1;

      const changed = r.valueTier !== tier || r.valueScore !== score;
      if (!changed) {
        skipped++;
        continue;
      }
      if (DRY) continue;

      if (FORCE || changed) {
        await coll.doc(r._id).update({ valueTier: tier, valueScore: score });
        updated++;
      }
    }

    if (list.length < LIMIT) break;
    skip += LIMIT;
  }

  const summary = { total, updated, skipped, distribution: dist, FORCE, DRY };
  writeFileSync("scripts/backfill-value-tier.log", JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
