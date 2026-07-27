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
  const merged = await coll.where({ contentStatus: "merged" }).field({ slug: true, mergedIntoSlug: true }).limit(100).get();
  const rows = merged.data as any[];

  // 收集所有目标 slug
  const targetSlugs = [...new Set(rows.map((r) => r.mergedIntoSlug).filter(Boolean))] as string[];
  const targets = await coll.where({ slug: db.command.in(targetSlugs) }).field({ slug: true, contentStatus: true, title: true }).get();
  const targetSet = new Set((targets.data as any[]).map((t) => t.slug));
  const targetStatus = new Map((targets.data as any[]).map((t) => [t.slug, t.contentStatus]));

  // 宽松：看 kefu-2024 系列主案例是否以别的形式存在
  const all = await coll.field({ slug: true, contentStatus: true }).limit(1000).get();
  const allSlugs = (all.data as any[]).map((d) => d.slug) as string[];
  const kefuHits = allSlugs.filter((s) => s.includes("kefu-2024"));

  let report = "mergedTotal=" + rows.length + "\n";
  report += "distinct target slugs=" + targetSlugs.length + "\n";
  report += "targets found in DB=" + targets.data.length + "\n";
  report += "targets MISSING=" + (targetSlugs.length - targets.data.length) + "\n";
  report += "missing target slugs:\n" + targetSlugs.filter((s) => !targetSet.has(s)).map((s) => "  - " + s).join("\n") + "\n";
  report += "missing target status分布:" + JSON.stringify([...new Set(targetSlugs.filter((s) => !targetSet.has(s)).map((s) => s))].slice(0, 50)) + "\n";
  report += "kefu-2024* slugs in entire collection (" + kefuHits.length + "):\n" + kefuHits.slice(0, 30).map((s) => "  " + s).join("\n") + "\n";
  writeFileSync("collectors/check-merged2.out", report, "utf8");
})().catch((e) => {
  writeFileSync("collectors/check-merged2.out", "ERR " + (e?.message || e));
  process.exit(1);
});
