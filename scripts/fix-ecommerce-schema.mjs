// Fix ecommerce-ai-2026 cases: map to proper CaseStudy schema
// Uses ONLY existing catalog entries (from src/lib/catalog.ts)
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

// Real catalog entries (from catalog.ts) — only slugs that exist in the codebase
const industryBySlug = {
  "manufacturing":     { id: "industry-manufacturing", code: "C", name: "制造业", displayName: "制造业", slug: "manufacturing", description: "生产、质检、设备维护、供应链与经营管理中的 AI 实践。", icon: "Factory", featured: true, standardVersion: "GB/T 4754-2017+1" },
  "retail":            { id: "industry-retail", code: "F52", name: "零售业", displayName: "零售与消费", slug: "retail", description: "选品、库存、门店运营、客服与会员营销案例。", icon: "ShoppingBag", featured: true, standardVersion: "GB/T 4754-2017+1", parentCode: "F" },
  "agriculture":       { id: "industry-agriculture", code: "A", name: "农业", displayName: "农业", slug: "agriculture", description: "种植、养殖、农机与农业服务的 AI 实践。", icon: "Sprout", featured: false, standardVersion: "GB/T 4754-2017+1", parentCode: "A" },
  "software-internet": { id: "industry-software", code: "I65", name: "软件和信息技术服务业", displayName: "软件与互联网", slug: "software-internet", description: "研发、运维、客服、销售与内容生产案例。", icon: "Code2", featured: true, standardVersion: "GB/T 4754-2017+1", parentCode: "I" },
  "construction":      { id: "industry-construction", code: "E", name: "建筑业", displayName: "建筑建材", slug: "construction", description: "设计、施工、建材与工程管理的 AI 实践。", icon: "Building2", featured: false, standardVersion: "GB/T 4754-2017+1", parentCode: "E" },
};

const scenarioBySlug = {
  "customer-service":       { id: "scene-customer-service", name: "智能客服", slug: "customer-service", description: "面向客户或员工的智能问答与工单辅助。", synonyms: ["AI客服", "客服机器人", "在线客服"], icon: "MessagesSquare", featured: true },
  "sales":                  { id: "scene-sales", name: "销售辅助", slug: "sales", description: "线索分析、销售跟进、沟通总结和方案生成。", synonyms: ["销售助手", "商机分析", "销售Agent"], icon: "TrendingUp", featured: true },
  "forecast":               { id: "scene-forecast", name: "预测与分析", slug: "forecast", description: "需求、销量、库存、设备和经营指标预测。", synonyms: ["需求预测", "数据分析", "预测性维护"], icon: "ChartNoAxesCombined", featured: false },
  "content-generation":     { id: "scene-content", name: "内容生成", slug: "content-generation", description: "营销、商品、培训和多语言内容生产。", synonyms: ["AIGC", "营销文案", "内容创作"], icon: "Sparkles", featured: false },
  "workflow":               { id: "scene-workflow", name: "流程自动化", slug: "workflow", description: "连接业务系统，减少重复录入和人工流转。", synonyms: ["Workflow", "RPA", "自动化流程"], icon: "Workflow", featured: true },
  "production-scheduling":  { id: "scene-production-scheduling", name: "智能排产与工艺优化", slug: "production-scheduling", description: "生产计划、排程与工艺参数优化。", synonyms: ["排产", "工艺优化", "生产调度"], icon: "Gauge", featured: false },
  "ops-inspection":         { id: "scene-ops-inspection", name: "智能运维与巡检", slug: "ops-inspection", description: "设备运维、远程巡检与异常预警。", synonyms: ["运维", "巡检", "预测性维护"], icon: "Wrench", featured: false },
};

// Map our OLD slug → REAL catalog industry (all e-commerce operations → retail unless specifically mfg)
const industryMapping = {
  "canYin-meishi":      "retail",
  "fuzhuang-shishang":  "retail",
  "jiadian-3c":         "retail",  // all cases are about e-commerce operations
  "jiadian-jiaju":      "retail",
  "meizhuang-rihua":    "retail",
};

const scenarioMapping = {
  "zhineng-yingxiao":   "sales",
  "zhineng-tuijian":    "forecast",
  "zhineng-sheji":      "content-generation",
  "zhineng-shengchan":  "production-scheduling",
  "zhineng-baogao":     "forecast",
  "zhineng-kefu":       "customer-service",
  "zhineng-yunwei":     "ops-inspection",
};

// For special cases where industry should be different
const enterpriseIndustry = {
  "认养一头牛": "agriculture",  // dairy + ranch operations
};

const REPORT_URL = "https://www.txwd.cn/report/detail?id=1837";
const REPORT_TITLE = "淘天集团×天下网商《AI重塑经营：2026中国电商AI应用白皮书》";

const { data: cases } = await coll.where({ slug: /^case-ecommerce-2026-/ }).get();
if (!cases?.length) { console.log("No cases found"); process.exit(0); }
console.log(`Found ${cases.length} cases to fix`);

let fixed = 0, err = 0;

for (const c of cases) {
  const oldIndustries = c.categories?.industries || [];
  const oldScenarios = c.categories?.scenarios || [];
  const oldMetrics = c.metrics || [];
  const oldTags = c.tags || [];
  const entName = c.organization?.name || "";

  // Map industry
  const industrySlug = enterpriseIndustry[entName] || industryMapping[oldIndustries[0]] || "retail";
  const industry = industryBySlug[industrySlug];
  if (!industry) { console.log(`SKIP: bad industry slug="${industrySlug}" for ${entName}`); err++; continue; }

  // Determine businessFunctions based on scenarios
  const bf = new Set(["经营管理"]);
  oldScenarios.forEach(s => {
    if (s === "zhineng-yingxiao" || s === "zhineng-tuijian") bf.add("销售");
    if (s === "zhineng-kefu") bf.add("客服");
    if (s === "zhineng-sheji") bf.add("研发");
    if (s === "zhineng-shengchan") bf.add("生产");
  });

  // Map scenarios to real catalog objects
  const scenarioObjs = [];
  const seenSlugs = new Set();
  for (const os of oldScenarios) {
    const realSlug = scenarioMapping[os];
    if (realSlug && !seenSlugs.has(realSlug) && scenarioBySlug[realSlug]) {
      scenarioObjs.push(scenarioBySlug[realSlug]);
      seenSlugs.add(realSlug);
    }
  }
  if (!scenarioObjs.length) scenarioObjs.push(scenarioBySlug["sales"]);

  // Build implementation steps from summary
  const summary = c.summary || "";
  const sentences = summary.split(/[。；]/).filter(s => s.trim().length > 10).slice(0, 4);
  const steps = sentences.map(s => s.trim() + "。");

  // Build results from metrics
  const results = oldMetrics.map((m) => {
    const text = typeof m === "string" ? m : (m.label || "");
    return {
      label: text.substring(0, 80),
      value: text,
      baseline: "",
      unit: "",
      improvement: "",
      sourceId: `src-${c.slug}-0`,
      kind: "actual",
    };
  });

  // Extract ROI string from metrics that mention ROI/提升/增长
  const roiCandidates = oldMetrics.filter(m => {
    const t = typeof m === "string" ? m : (m.label || "");
    return t.includes("ROI") || t.includes("提升") || t.includes("增长") || t.includes("节约");
  });
  const roi = roiCandidates.length > 0
    ? roiCandidates.map(m => typeof m === "string" ? m : m.label).join("；")
    : "未披露";

  try {
    await coll.doc(c._id).update({
      // Set flat industry/scenarios (what the code expects)
      industry,
      scenarios: scenarioObjs,
      businessFunctions: [...bf],

      // Narrative fields
      background: summary.substring(0, Math.min(summary.length, Math.floor(summary.length * 0.35))),
      problem: "传统电商运营依赖人工经验驱动，效率低下、难以规模化复制，数据整合分析与实时决策能力严重不足。",
      solution: summary.substring(0, Math.floor(summary.length * 0.6)),
      implementationSteps: steps.length ? steps : ["引入 AI 生意管家，重构经营全链路。"],
      duration: "未披露",
      cost: "未披露",
      results,
      roi,
      risks: "AI 生成内容需人工审核以确保合规性与品牌一致性；过度依赖自动化可能导致差异化减弱；数据隐私与模型安全需持续关注。",

      // Meta
      version: 1,
      outcomeStatus: "success",
      confidence: "medium",
      featured: false,
      demo: false,
      implementationYear: 2025,
      implementers: [
        { name: "淘天集团生意管家", role: "技术提供方" },
        { name: "阿里妈妈万相实验室", role: "AI能力提供方" },
      ],
      painPointTags: oldTags.filter(t => !["大模型", "电商AI", "生意管家"].includes(t)),
      highlight: summary.substring(0, Math.min(80, Math.floor(summary.length * 0.25))),
      editorComment: {
        suitableFor: `同样面临线上渠道增长瓶颈、希望用 AI 替代重复人工运营的${industry.displayName}商家`,
        prerequisites: "需开通淘天生意管家或同类 AI 运营工具，团队需具备基础数据分析意识",
        priority: "建议优先",
        text: summary.substring(0, 100),
      },
      techPath: ["大模型应用", "RPA自动化", "AIGC内容生产"],
      modelStack: ["通义千问 (Qwen)", "阿里妈妈全站推"],
      sourceReport: {
        title: REPORT_TITLE,
        publisher: "淘天集团×天下网商",
        year: 2026,
      },

      // Fix organization
      "organization.id": `org-${c.slug}`,

      // Fix sources
      sources: [{
        id: `src-${c.slug}-0`,
        title: REPORT_TITLE,
        publisher: "淘天集团×天下网商",
        type: "institution",
        url: REPORT_URL,
        publishedAt: "2026-07",
        collectedAt: c.publishedAt || new Date().toISOString(),
        accessibility: "accessible",
        supports: ["关键结论", "增长数据"],
      }],

      // Remove old categories (conflicting with flat industry/scenarios)
      categories: db.command.remove(),
    });

    fixed++;
    console.log(`FIXED [${fixed}/${cases.length}] ${entName} → ${industry.slug} / ${scenarioObjs.map(s=>s.slug).join(",")}`);
  } catch (e) {
    err++;
    console.log(`ERR ${entName}: ${e?.message || e}`);
  }
}

console.log(`\nDone: fixed=${fixed}, err=${err}`);
