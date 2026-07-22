// 将 ecommerce-ai-2026.json 中的电商AI白皮书案例插入 CloudBase cases 集合
// 按 enterprise + title 做云端去重
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

const TODAY = new Date().toISOString();
const REPORT_URL = "https://www.txwd.cn/report/detail?id=1837";
const REPORT_TITLE = "淘天集团×天下网商《AI重塑经营：2026中国电商AI应用白皮书》";

const sizeOverrides = {
  "Manner 咖啡": "501–1000人",
  "多吉米新中式首饰": "1–20人",
  "悍途户外 (HUMTTO)": "101–500人",
  "老板电器 (ROBAM)": "1000人以上",
  "联想 (Lenovo)": "1000人以上",
  "妮轻 (NEARKINS)": "101–500人",
  "纳艾森": "21–50人",
  "蔓斯菲尔 (M.S.Feel)": "101–500人",
  "珀莱雅 (PROYA)": "1000人以上",
  "比音勒芬": "1000人以上",
  "某头部时尚男装品牌": "1000人以上",
  "黛世旗舰店": "51–100人",
  "某知名美妆店铺": "501–1000人",
  "认养一头牛": "501–1000人",
};

const cases = JSON.parse(
  readFileSync(join(process.cwd(), "scripts", "extracted", "ecommerce-ai-2026.json"), "utf-8")
);

let inserted = 0;
let skipped = 0;

for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const idx = i + 1;

  // 去重：按标题
  const ex = await coll
    .where({ title: c.title })
    .field({ _id: true })
    .limit(1)
    .get();
  if (ex && ex.data && ex.data.length) {
    skipped += 1;
    console.log(`SKIP(exists) ${c.enterprise} | ${c.title.substring(0, 50)}...`);
    continue;
  }

  const size = sizeOverrides[c.enterprise] || "未披露";
  const slug = `case-ecommerce-2026-${idx}`;
  const id = slug;

  const metrics = (c.metrics || []).map((m) => ({ label: m, value: "", unit: "" }));
  const industries = Array.isArray(c.industry) ? c.industry : [c.industry];
  const scenarios = Array.isArray(c.scenario) ? c.scenario : [c.scenario];

  const doc = {
    id,
    slug,
    demo: false,
    contentStatus: "published",
    title: c.title,
    summary: c.summary,
    thumbnail: "",
    categories: {
      industries,
      scenarios,
      aiTech: ["llm"],
    },
    organization: {
      name: c.enterprise,
      region: "",
      type: "企业",
      size,
    },
    sources: [
      {
        id: `src-${slug}-0`,
        title: REPORT_TITLE,
        publisher: "淘天集团×天下网商",
        type: "report",
        url: REPORT_URL,
        publishedAt: "2026-07",
        collectedAt: TODAY,
        accessibility: "accessible",
        supports: ["关键结论", "增长数据"],
      },
    ],
    metrics,
    tags: ["大模型", "电商AI", "生意管家"],
    publishedAt: TODAY,
    updatedAt: TODAY,
    views: 0,
  };

  try {
    await coll.add(doc);
    inserted += 1;
    console.log(`INSERT [${idx}/${cases.length}] ${c.enterprise} | ${c.title.substring(0, 40)}...  size=${size}`);
  } catch (e) {
    console.log(`ERR ${c.enterprise}: ${e && e.message ? e.message : e}`);
  }
}

console.log(`\n[insert] 完成：新增 ${inserted} 条，跳过 ${skipped} 条`);
