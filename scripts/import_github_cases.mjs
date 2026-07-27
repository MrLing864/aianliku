// 将 ai-use-cases-library (github) 的 use-cases.csv 全量翻译并导入 CloudBase cases 集合。
// 流程：CSV 解析 → 分批 DeepSeek 翻译+行业/场景映射+年份提取+国内外判定 → 构造 CaseStudy → 写入云端。
// 幂等：按 id(slug=gh-<CaseID>) 跳过已导入。可重复运行以续传/补录。
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import cloudbase from "@cloudbase/node-sdk";

// ---------- 加载 .env ----------
const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
}
const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

// ---------- 日志 ----------
const LOG_DIR = join(process.cwd(), "scripts", "logs");
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
const LOG = join(LOG_DIR, "import-github.log");
const log = (s) => { const line = `[${new Date().toISOString()}] ${s}`; console.log(line); appendFileSync(LOG, line + "\n"); };

// ---------- 分类目录（与 src/lib/catalog.ts 保持一致） ----------
const INDUSTRIES = [
  { slug: "manufacturing", name: "制造业" }, { slug: "retail", name: "零售业" },
  { slug: "foreign-trade", name: "外贸与批发" }, { slug: "logistics", name: "物流与仓储" },
  { slug: "finance", name: "金融业" }, { slug: "healthcare", name: "医疗健康" },
  { slug: "education", name: "教育" }, { slug: "software-internet", name: "软件与互联网" },
  { slug: "energy-mining", name: "能源与矿山" }, { slug: "automotive", name: "汽车" },
  { slug: "telecom", name: "通信" }, { slug: "government", name: "政务与公共服务" },
  { slug: "aerospace", name: "航空航天" }, { slug: "construction", name: "建筑建材" },
  { slug: "agriculture", name: "农业" }, { slug: "other", name: "其他行业" },
];
const SCENARIOS = [
  { slug: "ocr", name: "OCR / 文档识别" }, { slug: "customer-service", name: "智能客服" },
  { slug: "knowledge-base", name: "企业知识库" }, { slug: "sales", name: "销售辅助" },
  { slug: "quotation", name: "智能报价" }, { slug: "workflow", name: "流程自动化" },
  { slug: "quality-inspection", name: "智能质检" }, { slug: "forecast", name: "预测与分析" },
  { slug: "content-generation", name: "内容生成" }, { slug: "agent", name: "Agent" },
  { slug: "production-scheduling", name: "智能排产与工艺优化" }, { slug: "ops-inspection", name: "智能运维与巡检" },
  { slug: "rnd-design", name: "研发设计与仿真" }, { slug: "ai-infra", name: "算力基础设施与AI平台" },
];
const SIZE_BANDS = ["1–20人", "21–50人", "51–100人", "101–500人", "501–1000人", "1000人以上", "未披露"];

// 简化价值分级（与 src/lib/value-tier.ts 同口径，这里在脚本内联一份以便不依赖 ts 编译）
function computeValueTier(c) {
  const text = [
    c.roi, c.cost,
    ...(c.results || []).map((r) => [r.value, r.improvement, r.baseline, r.unit].join(" ")),
    c.background, c.solution,
  ].filter(Boolean).join(" ");
  const hasMoney = /营收|收入|利润|成本|收益|销售额|产值|节约|降本|增收|投资|回报|费用|金额|资金|经费|[￥$¥€£]|人民币|美元|英镑|欧元|日元|港元|RMB|CNY|USD|GBP|EUR|JPY|HKD/i.test(text);
  const hasBenefit = /提升|提高|降低|下降|节约|增收|提效|增效|优化|减少|加快|缩短|降本|增长|效率|显著|大幅/.test(text);
  let benefit = 0;
  if (hasMoney) benefit = 55;
  if (hasBenefit) benefit = Math.max(benefit, 50);
  if (/大幅|显著|十倍|翻倍|成倍|数倍|千万级|百万级|亿级|十亿级/.test(text)) benefit = 70;
  let benchmark = 15;
  if (c.organization?.type === "soe") benchmark += 10;
  let reference = 10;
  if (c.background && String(c.background).length > 40) reference += 15;
  if (c.solution && String(c.solution).length > 40) reference += 15;
  if (Array.isArray(c.results) && c.results.length >= 2) reference += 10;
  if (c.confidence === "high") reference += 20;
  const score = Math.round(0.5 * benefit + 0.3 * benchmark + 0.2 * reference);
  const tier = score >= 75 ? "extreme" : score >= 60 ? "high" : score >= 40 ? "medium" : "low";
  return { tier, score: Math.max(0, Math.min(100, score)) };
}

// ---------- DeepSeek ----------
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) { log("ERROR: DEEPSEEK_API_KEY missing"); process.exit(1); }
const MODEL = process.env.AI_MODEL || "deepseek-v4-pro";

async function translateBatch(batch) {
  const indList = INDUSTRIES.map((i) => `${i.slug}（${i.name}）`).join("、");
  const scList = SCENARIOS.map((s) => `${s.slug}（${s.name}）`).join("、");
  const sys = `你是专业科技翻译与企业AI案例分析师，精通中英互译与企业AI落地场景。
任务：把给定的英文AI落地案例逐条精准翻译成中文，并适配中国语境。要求：
1. 翻译必须精准、专业、通顺，保留所有关键数据与事实（金额、百分比、人名、机构名、产品/技术名可保留英文并在首次出现时附中文）。不要改写、不要删减、不要编造。
2. 所有文本字段（organization、title、summary、outcomes 各项、tools 各项）必须翻译成中文，不得保留英文原文（专名可中英并列）。
3. 把英文行业/领域映射到中国行业分类（从给定列表选最贴切的1个 industrySlug）。
4. 把应用场景映射到给定场景列表（选1-3个最贴切的 scenarioSlug）。
5. 从原文提取实施年份 year（如"in 2023"/"2022年"等；不确定或缺失填 null）。
6. 判断 isChinese：仅当原文明确出现 Chinese / China / 中国企业 / 某中国城市或公司时=true，否则 false（绝大多数应为 false）。
7. organization 是被改造/采用AI的企业（不是技术提供方）。在 description/tools 里出现的 OpenAI/Google 等是技术提供方，不是 organization。
8. 必须在每个输出元素中带回输入里的 idx 字段（整数，保持不变），用于对齐。
只输出一个 JSON 对象，格式严格为 {"items":[...]}，其中 items 是案例数组。每个案例元素字段：idx(整数), organization, title, summary(用中文概述背景/做法/成效，250-400字，必填不得为空), outcomes(数组，每条为原文 Outcomes & Benefits 的中文逐条翻译，保留要点), tools(技术/工具中文名数组), industrySlug, scenarioSlugs(数组), year(数字或null), isChinese(布尔)。
不要输出任何解释文字，只输出上述 JSON 对象。
行业列表：${indList}
场景列表：${scList}`;
  const userPayload = batch.map((r, i) => ({
    idx: i,
    Organization: r.Organization,
    "Use Case Title": r["Use Case Title"],
    Description: r.Description,
    "Org Industry": r["Org Industry"],
    "Use Case Industry": r["Use Case Industry"],
    "Subindustry Tags": r["Subindustry Tags"],
    "Use Case Domain": r["Use Case Domain"],
    "Tool/Technology": r["Tool/Technology"],
    "Outcomes & Benefits": r["Outcomes & Benefits"],
  }));
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: "请翻译以下 " + batch.length + " 条案例：\n" + JSON.stringify(userPayload, null, 2) },
    ],
    response_format: { type: "json_object" },
    max_tokens: 8192,
    temperature: 0.1,
  };
  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`DeepSeek HTTP ${resp.status}: ${t.slice(0, 300)}`);
  }
  const j = await resp.json();
  let content = j.choices?.[0]?.message?.content || "[]";
  content = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(content);
  const arr = Array.isArray(parsed) ? parsed : parsed.items || parsed.cases || parsed.results;
  if (!Array.isArray(arr)) throw new Error("DeepSeek 返回非数组: " + content.slice(0, 200));
  return arr;
}

// ---------- 主流程 ----------
const CSV_PATH = process.argv[2] || "..\\..\\ai-use-cases-library-main\\data\\use-cases.csv";
const BATCH = parseInt(process.env.BATCH || "8", 10);
const SKIP = parseInt(process.env.SKIP || "0", 10);
const MAX = parseInt(process.env.MAX || "0", 10); // 0 = 全部

async function main() {
  if (!existsSync(CSV_PATH)) { log("ERROR CSV not found: " + CSV_PATH); process.exit(1); }
  const raw = readFileSync(CSV_PATH, "utf-8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, bom: true });
  log(`CSV 读取 ${records.length} 条。BATCH=${BATCH} SKIP=${SKIP} MAX=${MAX}`);

  const CONCURRENCY = parseInt(process.env.CONCURRENCY || "3", 10);
  let inserted = 0, skipped = 0, failed = 0;
  const total = records.length;

  async function processBatch(i) {
    const end = Math.min(i + BATCH, total);
    if (MAX > 0 && (i - SKIP) >= MAX) return;
    const batch = records.slice(i, end);
    // 整批跳过：首条已存在则视为该批已完成（幂等续传）
    const firstId = `gh-${batch[0].CaseID || ("row" + i)}`;
    try {
      const ex = await coll.where({ id: firstId }).field({ _id: true }).limit(1).get();
      if (ex && ex.data && ex.data.length) { skipped += batch.length; log(`SKIP_BATCH ${firstId}`); return; }
    } catch (_) { /* 继续 */ }

    let tr;
    try {
      tr = await translateBatch(batch);
    } catch (e) {
      log(`TRANSLATE_FAIL rows ${i}-${end}: ${e.message}`);
      failed += batch.length;
      await new Promise((r) => setTimeout(r, 3000));
      return;
    }
    for (let k = 0; k < batch.length; k++) {
      const src = batch[k];
      let t = (tr.find((x) => x && x.idx === k)) || tr[k] || {};
      // 单条补译：标题或概述缺失时单独重试一次
      if (!t.title || !t.summary) {
        try {
          const one = await translateBatch([src]);
          if (one[0] && one[0].title && one[0].summary) t = one[0];
        } catch (_) { /* 保留原 t */ }
      }
      if (!t.title || !t.summary) {
        failed++;
        log(`SKIP_EMPTY ${src.CaseID || ("row" + (i + k))}`);
        continue;
      }
      const caseId = (src.CaseID || `row${i + k}`).trim();
      const id = `gh-${caseId}`;
      const slug = id;
      try {
        const ex = await coll.where({ id }).field({ _id: true }).limit(1).get();
        if (ex && ex.data && ex.data.length) { skipped++; continue; }
      } catch (e) { /* 忽略查询错误，继续 */ }

      const orgName = (t.organization || src.Organization || "").trim();
      const isChinese = t.isChinese === true;
      const year = (typeof t.year === "number" && t.year > 1990 && t.year < 2100) ? t.year : null;
      const scenarioSlugs = Array.isArray(t.scenarioSlugs) ? t.scenarioSlugs.filter((s) => SCENARIOS.some((x) => x.slug === s)) : [];
      const industrySlug = INDUSTRIES.some((x) => x.slug === t.industrySlug) ? t.industrySlug : "other";
      const outcomes = Array.isArray(t.outcomes) ? t.outcomes.map((o) => String(o).trim()).filter(Boolean) : [];
      const tools = Array.isArray(t.tools) ? t.tools.map((o) => String(o).trim()).filter(Boolean) : [];
      const sourceUrl = (src["Source URL"] || "").trim();
      const sourceName = (src.Source || "GitHub AI Use Cases Library").trim();

      const doc = {
        id, slug, demo: false,
        contentStatus: "published",
        title: (t.title || src["Use Case Title"] || "").trim(),
        summary: (t.summary || "").trim(),
        thumbnail: "",
        categories: {
          industries: [industrySlug],
          scenarios: scenarioSlugs.length ? scenarioSlugs : ["agent"],
          aiTech: ["llm"],
        },
        businessFunctions: [],
        organization: {
          id: caseId,
          name: orgName,
          size: "未披露",
          region: isChinese ? "中国" : "",
          type: isChinese ? "private" : "foreign",
          anonymous: false,
        },
        country: isChinese ? "国内" : "国外",
        background: (t.summary || "").trim(),
        problem: "",
        solution: "",
        implementationSteps: [],
        duration: "",
        cost: "",
        investmentRange: { min: null, max: null, currency: "CNY", narrative: "" },
        results: outcomes.map((o, idx) => ({ id: `r-${idx}`, label: o, value: "", baseline: "", improvement: "", unit: "", source: "" })),
        roi: "",
        risks: "",
        failureReason: "",
        editorComment: { suitableFor: "", recommendedActions: "", priority: "条件具备后开展", viewerValue: "" },
        testimonial: { quote: "", author: "", role: "" },
        implementers: tools.slice(0, 4).map((nm, idx) => ({ id: `imp-${idx}`, name: nm, role: "技术提供方", contribution: "" })),
        outcomeStatus: "success",
        confidence: "medium",
        painPointTags: [],
        sources: [{
          id: `src-0`,
          title: (t.title || src["Use Case Title"] || ""),
          publisher: sourceName,
          type: "company",
          url: sourceUrl,
          publishedAt: year ? String(year) : "",
          collectedAt: new Date().toISOString(),
          accessibility: sourceUrl ? "accessible" : "unknown",
          supports: ["关键结论"],
        }],
        tags: tools.length ? tools.slice(0, 6) : ["AI应用"],
        featured: false,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
      };
      const vt = computeValueTier(doc);
      doc.valueTier = vt.tier;
      doc.valueScore = vt.score;

      try {
        await coll.add(doc);
        inserted++;
        log(`INSERT ${id} | ${doc.title.slice(0, 30)} [${industrySlug}/${scenarioSlugs.join(",")}] year=${year} country=${doc.country} tier=${vt.tier}`);
      } catch (e) {
        failed++;
        log(`FAIL ${id}: ${e && e.message ? e.message : e}`);
      }
    }
  }

  // 并发池：CONCURRENCY 个批次并行翻译+入库
  const ranges = [];
  for (let i = SKIP; i < total; i += BATCH) ranges.push(i);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= ranges.length) break;
      try { await processBatch(ranges[idx]); }
      catch (e) { log(`BATCH_ERR ${ranges[idx]}: ${e && e.message ? e.message : e}`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  log(`DONE inserted=${inserted} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => { log("MAIN ERR " + (e && e.stack ? e.stack : e)); process.exit(2); });
