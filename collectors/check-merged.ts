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
  const mergedColl = db.collection("cases");
  // 取 merged 案例（含 slug / mergedIntoSlug / sources / mergedCaseIds）
  const merged = await mergedColl
    .where({ contentStatus: "merged" })
    .field({ slug: true, title: true, organization: true, mergedIntoSlug: true, sources: true, mergedCaseIds: true })
    .limit(100)
    .get();

  const rows = merged.data as any[];
  writeFileSync("collectors/check-merged.out", "mergedCount=" + rows.length + "\n");

  // 抽 5 个
  const sample = rows.slice(0, 5);
  const targetSlugs = [...new Set(sample.map((r) => r.mergedIntoSlug).filter(Boolean))];

  // 取主案例
  const targets = await mergedColl.where({ slug: db.command.in(targetSlugs) }).get();
  const targetMap = new Map((targets.data as any[]).map((t) => [t.slug, t]));

  let report = "";
  for (const m of sample) {
    const t = m.mergedIntoSlug ? targetMap.get(m.mergedIntoSlug) : null;
    report += "\n=== MERGED ===\n";
    report += "slug: " + m.slug + "\n";
    report += "title: " + (m.title || "") + "\n";
    report += "org: " + (m.organization?.name || "") + "\n";
    report += "mergedIntoSlug: " + (m.mergedIntoSlug || "(无!)") + "\n";
    report += "mergedCaseIds: " + JSON.stringify(m.mergedCaseIds || []) + "\n";
    report += "sources(自身): " + JSON.stringify((m.sources || []).map((s: any) => s.title || s.url || s)) + "\n";
    if (!t) {
      report += ">> 主案例未找到! (可能 mergedIntoSlug 失效)\n";
    } else {
      report += "--- TARGET(published?) ---\n";
      report += "target contentStatus: " + t.contentStatus + "\n";
      report += "target title: " + (t.title || "") + "\n";
      report += "target mergedCaseIds: " + JSON.stringify(t.mergedCaseIds || []) + "\n";
      report += "target sources count: " + ((t.sources || []).length) + "\n";
      report += "target sources titles: " + JSON.stringify((t.sources || []).map((s: any) => s.title || s.url || s)) + "\n";
      const contains = (t.mergedCaseIds || []).includes(m.slug) || (t.mergedCaseIds || []).includes(m.id);
      report += ">> 主案例 mergedCaseIds 是否包含本 merged: " + contains + "\n";
    }
  }
  writeFileSync("collectors/check-merged.out", "mergedCount=" + rows.length + "\n" + report, "utf8");
})().catch((e) => {
  writeFileSync("collectors/check-merged.out", "ERR " + (e?.message || e));
  process.exit(1);
});
