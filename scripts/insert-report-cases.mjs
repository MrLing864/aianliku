// 将 scripts/extracted/*.json 中的报告案例插入 CloudBase cases 集合。
// - 按 enterprise+title 在批次内与云端做去重（幂等，可重复运行）
// - 应用 sizeOverrides（人数规模）与报告来源 originalUrl
// - 两个"企业名撞库但案例不同"的案例（武汉人工智能研究院/嫦娥工程、中国电信/知识库问答）按不同案例插入
import { readdirSync, readFileSync } from "node:fs";
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

// 每个抽取文件对应的报告来源（用于来源链接 originalUrl）
const reportMeta = {
  "top30.json": {
    url: "https://www.jnexpert.com/report/detail?id=565",
    title: "沙丘社区《2024中国大模型先锋案例TOP30》",
  },
  "kefu-top10-2024.json": {
    url: "https://www.shaqiu.cn/article/1awlLovn9WzP",
    title: "沙丘社区《2024中国大模型+智能客服最佳实践案例TOP10》",
  },
};
const TODAY = new Date().toISOString();

const sizeOverrides = {
  勃林格殷格翰: "1000人以上",
  八爪网络: "21–50人",
  东方资管: "1000人以上",
  广发证券: "1000人以上",
  国家电网: "1000人以上",
  国金证券: "1000人以上",
  招商银行: "1000人以上",
  伊利: "1000人以上",
  联想: "1000人以上",
  中国移动: "1000人以上",
  蚂蚁集团: "1000人以上",
  海尔智家: "1000人以上",
  中国南方航空: "1000人以上",
  京东: "1000人以上",
  美团: "1000人以上",
  "湖北省市场管理监督局宣教中心": "未披露",
  海盟控股: "51–100人",
  吉利汽车: "1000人以上",
  "济南市中公安分局": "未披露",
  雷火游戏: "1000人以上",
  诺亚财富: "1000人以上",
  思必驰: "501–1000人",
  山东能源集团: "1000人以上",
  上汽乘用车: "1000人以上",
  天津金城银行: "1000人以上",
  泰康保险集团: "1000人以上",
  天士力集团: "1000人以上",
  天翼数科: "1000人以上",
  武汉人工智能研究院: "101–500人",
  星火保: "21–50人",
  元贝贝: "21–50人",
  阳光保险: "1000人以上",
  银河证券: "1000人以上",
  中国电信集团: "1000人以上",
  中国工商银行: "1000人以上",
  中国农业银行: "1000人以上",
  中国太保: "1000人以上",
  "自如ziroom": "1000人以上",
};
const govOrgs = new Set(["湖北省市场管理监督局宣教中心", "济南市中公安分局"]);

const EXT_DIR = join(process.cwd(), "scripts", "extracted");
const files = readdirSync(EXT_DIR).filter((f) => f.endsWith(".json"));
let cases = [];
for (const f of files) {
  const arr = JSON.parse(readFileSync(join(EXT_DIR, f), "utf-8"));
  cases = cases.concat(arr.map((c) => ({ ...c, _file: f })));
}
console.log(`[insert] 读取待入库案例 ${cases.length} 条`);

let inserted = 0;
let skipped = 0;
const perFileIdx = {};
for (const c of cases) {
  const fkey = c._file.replace(/\.json$/, "");
  perFileIdx[fkey] = (perFileIdx[fkey] || 0) + 1;
  const slug = `case-report-${fkey}-${perFileIdx[fkey]}`;
  const id = slug;
  // 云端去重：同标题或同企业+标题已存在则跳过
  const ex = await coll
    .where({ title: c.title })
    .field({ _id: true })
    .limit(1)
    .get();
  if (ex && ex.data && ex.data.length) {
    skipped += 1;
    console.log(`SKIP(exists) ${c.enterprise} | ${c.title}`);
    continue;
  }
  const size = sizeOverrides[c.enterprise] || "未披露";
  const meta = reportMeta[c._file] || { url: "", title: c.source || "报告" };
  const metrics = (c.metrics || []).map((m) => ({ label: m, value: "", unit: "" }));
  const doc = {
    id,
    slug,
    demo: false,
    contentStatus: "published",
    title: c.title,
    summary: c.provider ? `${c.summary}\n技术提供方/实施方：${c.provider}` : c.summary,
    thumbnail: "",
    categories: {
      industries: [c.industry],
      scenarios: Array.isArray(c.scenario) ? c.scenario : [c.scenario],
      aiTech: ["llm"],
    },
    organization: {
      name: c.enterprise,
      region: "",
      type: govOrgs.has(c.enterprise) ? "政府机构" : "企业",
      size,
    },
    sources: [
      {
        id: `src-${slug}-0`,
        title: meta.title,
        publisher: "沙丘社区",
        type: "report",
        url: meta.url,
        publishedAt: "",
        collectedAt: TODAY,
        accessibility: meta.url ? "accessible" : "unknown",
        supports: ["关键结论"],
      },
    ],
    metrics,
    tags: ["大模型"],
    publishedAt: TODAY,
    updatedAt: TODAY,
    views: 0,
  };
  try {
    await coll.add(doc);
    inserted += 1;
    console.log(`INSERT ${c.enterprise} | ${c.title}  [${c.industry}/${c.scenario}] size=${size}`);
  } catch (e) {
    console.log(`ERR ${c.enterprise} | ${c.title}: ${e && e.message ? e.message : e}`);
  }
}
console.log(`[insert] 完成：新增 ${inserted} 条，跳过 ${skipped} 条`);
