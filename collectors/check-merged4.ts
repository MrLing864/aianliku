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
  // 抽查主案例 case-kefu-2024-01，看它是否收录了源 merged 的 sources
  const target = await coll.where({ slug: "case-kefu-2024-01" }).field({ slug: true, title: true, mergedCaseIds: true, sources: true }).get();
  const t = (target.data as any[])[0];
  // 对应 merged 源：case-report-kefu-top10-2024-1 (招商银行)
  const src = await coll.where({ slug: "case-report-kefu-top10-2024-1" }).field({ slug: true, title: true, sources: true }).get();
  const s = (src.data as any[])[0];
  let report = "TARGET case-kefu-2024-01\n";
  report += "  title: " + t.title + "\n";
  report += "  mergedCaseIds(" + (t.mergedCaseIds?.length || 0) + "): " + JSON.stringify(t.mergedCaseIds || []) + "\n";
  report += "  sources(" + (t.sources?.length || 0) + "): " + JSON.stringify((t.sources || []).map((x: any) => x.title || x.url || x)) + "\n";
  report += "SOURCE case-report-kefu-top10-2024-1 (招商银行)\n";
  report += "  title: " + s.title + "\n";
  report += "  sources: " + JSON.stringify((s.sources || []).map((x: any) => x.title || x.url || x)) + "\n";
  const srcTitle = (s.sources || [])[0]?.title || "";
  const mergedInSources = (t.sources || []).some((x: any) => (x.title || "") === srcTitle);
  report += ">> 主案例 sources 是否包含源 merged 的来源(" + srcTitle + "): " + mergedInSources + "\n";
  const inMergedIds = (t.mergedCaseIds || []).includes("case-report-kefu-top10-2024-1");
  report += ">> 主案例 mergedCaseIds 是否含源 slug: " + inMergedIds + "\n";
  writeFileSync("collectors/check-merged4.out", report, "utf8");
})().catch((e) => {
  writeFileSync("collectors/check-merged4.out", "ERR " + (e?.message || e));
  process.exit(1);
});
