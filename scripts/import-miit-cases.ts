import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../src/lib/db/cloudbase";

const CASES_DIR = join(process.cwd(), "cases_json");

// —— 行业映射：优先采用工信部原始文件中的 industry.name（权威分类）——
// 工信部官方行业标签 → 站点行业 slug
const MIIT_INDUSTRY_MAP: Record<string, string> = {
  智能制造: "manufacturing",
  家电电子: "manufacturing",
  钢铁冶金: "manufacturing",
  汽车: "automotive",
  船舶海工: "manufacturing",
  纺织服装: "manufacturing",
  航空航天: "aerospace",
  建筑建材: "construction",
  能源电力: "energy-mining",
  石油石化: "energy-mining",
  有色金属: "energy-mining",
  医疗健康: "healthcare",
  零售电商: "retail",
  农业: "agriculture",
  教育: "education",
  物流供应链: "logistics",
  金融: "finance",
  政务与公共服务: "government",
  通信: "telecom",
  人工智能基础设施: "software-internet",
  其他行业: "other",
  专项应用: "other",
};

// 对工信部归入“其他行业/专项应用”的案例，再按正文内容细分到更具体的行业。
// 注意：先匹配“软件/云/AI 平台/基础设施”等平台型信号，避免把“在政务、交通、医疗、工业等领域落地”
// 这类列举式描述误判为某个具体行业；再匹配具体行业关键词。
const OTHER_INDUSTRY_RULES: Array<[RegExp, string]> = [
  [/航天|卫星|太空|轨道|火箭|星载|深空|导航卫星|空天/, "aerospace"],
  [/农业|种植|养殖|农机|灌溉|农田|畜牧|渔业|种业|农事|病虫害/, "agriculture"],
  [/建筑|施工|工地|基建|工程|建材|楼宇|装配式|土木/, "construction"],
  [/软件|云|大模型|算法|平台|算力|开发|代码|数据服务|信息系统|云服务|AI平台|人工智能基础设施|人工智能/, "software-internet"],
  [/钢铁|冶金|炼钢|轧钢|铸造|金属/, "manufacturing"],
  [/能源|电力|电网|光伏|风电|水电|核电|发电|供电|煤炭|燃气/, "energy-mining"],
  [/石油|石化|油气|化工|炼化/, "energy-mining"],
  [/汽车|整车|零部件|智能驾驶|车联网|新能源车企|车企/, "automotive"],
  [/医疗|医院|健康|诊疗|制药|基因|中医|疾控|卫生|问诊|影像/, "healthcare"],
  [/金融|银行|保险|证券|信贷|理财|征信|基金/, "finance"],
  [/政务|城市|公共|应急|城管|社保|民政|监管|综治|治理/, "government"],
  [/物流|运输|仓储|港口|供应链|配送|货运|邮政/, "logistics"],
  [/教育|教学|高校|学校|培训|教研|校园/, "education"],
  [/零售|电商|消费|门店|商超|文旅|旅游/, "retail"],
  [/通信|网络|运营商|5G|宽带|卫星通信/, "telecom"],
];

const INDUSTRY_META: Record<string, { id: string; name: string; displayName: string; icon: string; description: string; code: string }> = {
  manufacturing: { id: "industry-manufacturing", name: "制造业", displayName: "制造业", icon: "Factory", description: "生产、质检、设备维护、供应链与经营管理中的 AI 实践。", code: "C" },
  healthcare: { id: "industry-healthcare", name: "卫生", displayName: "医疗健康", icon: "HeartPulse", description: "病历、随访、辅助诊疗和医院运营案例。", code: "Q84" },
  education: { id: "industry-education", name: "教育", displayName: "教育", icon: "GraduationCap", description: "教学内容、教务、知识问答和学习支持案例。", code: "P" },
  retail: { id: "industry-retail", name: "零售业", displayName: "零售与消费", icon: "ShoppingBag", description: "选品、库存、门店运营、客服与会员营销案例。", code: "F52" },
  "energy-mining": { id: "industry-energy-mining", name: "采矿业", displayName: "能源与矿山", icon: "Fuel", description: "煤矿、油气、电力与矿山的智能化、安全管控与生产经营 AI 实践。", code: "B" },
  logistics: { id: "industry-logistics", name: "交通运输、仓储和邮政业", displayName: "物流与仓储", icon: "Truck", description: "订单、仓储、路径、调度和运力管理案例。", code: "G" },
  finance: { id: "industry-finance", name: "金融业", displayName: "金融", icon: "Landmark", description: "风控、合规、运营与知识服务案例。", code: "J" },
  government: { id: "industry-government", name: "公共管理、社会保障和社会组织", displayName: "政务与公共服务", icon: "Building2", description: "政务热线、政策问答、城市治理与公共服务的 AI 应用。", code: "S" },
  software: { id: "industry-software", name: "软件和信息技术服务业", displayName: "软件与互联网", icon: "Code2", description: "研发、运维、客服、销售与内容生产案例。", code: "I65" },
  "software-internet": { id: "industry-software", name: "软件和信息技术服务业", displayName: "软件与互联网", icon: "Code2", description: "研发、运维、客服、销售与内容生产案例。", code: "I65" },
  automotive: { id: "industry-automotive", name: "汽车制造业", displayName: "汽车", icon: "Car", description: "整车与零部件研发、制造、营销、客服与智能座舱案例。", code: "C36" },
  telecom: { id: "industry-telecom", name: "电信、广播电视和卫星传输服务", displayName: "通信", icon: "RadioTower", description: "网络运维、客服、营销与算力调度的 AI 实践。", code: "I63" },
  aerospace: { id: "industry-aerospace", name: "航空航天", displayName: "航空航天", icon: "Rocket", description: "卫星、航天器、航电与空天信息服务的 AI 实践。", code: "C37" },
  construction: { id: "industry-construction", name: "建筑业", displayName: "建筑建材", icon: "Building2", description: "设计、施工、建材与工程管理的 AI 实践。", code: "E" },
  agriculture: { id: "industry-agriculture", name: "农业", displayName: "农业", icon: "Sprout", description: "种植、养殖、农机与农业服务的 AI 实践。", code: "A" },
  other: { id: "industry-other", name: "其他", displayName: "其他行业", icon: "Layers", description: "难以归入上述行业的综合 AI 应用案例。", code: "Z99" },
};

const SCENARIO_CATALOG: Record<string, { id: string; name: string; slug: string; description: string; icon: string }> = {
  "customer-service": { id: "scene-customer-service", name: "智能客服", slug: "customer-service", description: "面向客户或员工的智能问答与工单辅助。", icon: "MessagesSquare" },
  knowledge: { id: "scene-knowledge", name: "企业知识库", slug: "knowledge-base", description: "让制度、产品和业务资料可检索、可问答。", icon: "LibraryBig" },
  sales: { id: "scene-sales", name: "销售辅助", slug: "sales", description: "线索分析、销售跟进、沟通总结和方案生成。", icon: "TrendingUp" },
  quotation: { id: "scene-quotation", name: "智能报价", slug: "quotation", description: "根据产品、物料和规则辅助快速、准确报价。", icon: "ReceiptText" },
  workflow: { id: "scene-workflow", name: "流程自动化", slug: "workflow", description: "连接业务系统，减少重复录入和人工流转。", icon: "Workflow" },
  quality: { id: "scene-quality", name: "智能质检", slug: "quality-inspection", description: "视觉、语音或文本质量检查和异常识别。", icon: "ScanSearch" },
  forecast: { id: "scene-forecast", name: "预测与分析", slug: "forecast", description: "需求、销量、库存、设备和经营指标预测。", icon: "ChartNoAxesCombined" },
  content: { id: "scene-content", name: "内容生成", slug: "content-generation", description: "营销、商品、培训和多语言内容生产。", icon: "Sparkles" },
  agent: { id: "scene-agent", name: "Agent", slug: "agent", description: "能够规划、调用工具并执行多步任务的 AI 助手。", icon: "Bot" },
  ocr: { id: "scene-ocr", name: "OCR / 文档识别", slug: "ocr", description: "从票据、合同、单据和图片提取结构化信息。", icon: "ScanText" },
  "production-scheduling": { id: "scene-production-scheduling", name: "智能排产与工艺优化", slug: "production-scheduling", description: "生产计划、排程与工艺参数优化。", icon: "Gauge" },
  "ops-inspection": { id: "scene-ops-inspection", name: "智能运维与巡检", slug: "ops-inspection", description: "设备运维、远程巡检与异常预警。", icon: "Wrench" },
  "rnd-design": { id: "scene-rnd-design", name: "研发设计与仿真", slug: "rnd-design", description: "研发设计、仿真与实验辅助。", icon: "FlaskConical" },
  "ai-infra": { id: "scene-ai-infra", name: "算力基础设施与AI平台", slug: "ai-infra", description: "算力调度、AI 平台与基础设施。", icon: "Cpu" },
};

// 工信部官方场景标签 → 站点场景 slug
const MIIT_SCENARIO_MAP: Record<string, string> = {
  行业大模型与智能体: "agent",
  智能排产与工艺优化: "production-scheduling",
  智能运维与巡检: "ops-inspection",
  智能质检与视觉检测: "quality-inspection",
  研发设计与仿真: "rnd-design",
   AI产品与智能应用: "agent",
  "智能客服与营销": "customer-service",
  算力基础设施与AI平台: "ai-infra",
  专项场景应用: "agent",
};

function deriveIndustrySlug(miitName: string, blob: string): string {
  const mapped = MIIT_INDUSTRY_MAP[miitName];
  if (mapped && mapped !== "other") return mapped;
  // 其他行业/专项应用：按内容进一步细分
  for (const [re, slug] of OTHER_INDUSTRY_RULES) {
    if (re.test(blob)) return slug;
  }
  return "other";
}

function deriveScenarioSlugs(scenarios: Array<{ name?: string }>): string[] {
  const slugs = new Set<string>();
  for (const s of scenarios) {
    const slug = MIIT_SCENARIO_MAP[(s.name || "").trim()];
    if (slug) slugs.add(slug);
  }
  if (slugs.size === 0) slugs.add("agent");
  return [...slugs];
}

function toIso(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  return d.toISOString() === "Invalid Date" ? new Date().toISOString() : d.toISOString();
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface RawCase {
  [k: string]: unknown;
}

async function main() {
  const files = readdirSync(CASES_DIR)
    .filter((f) => f.startsWith("case-2025-") && f.endsWith(".json"))
    .sort();

  console.log(`[import] 读取到 ${files.length} 个案例文件`);

  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < files.length; i++) {
    const raw = JSON.parse(readFileSync(join(CASES_DIR, files[i]), "utf-8")) as RawCase;
    const id = (raw.id as string) || `miit-2025-${String(i + 1).padStart(4, "0")}`;
    const slug = id;
    const orgRaw = (raw.organization as RawCase) || {};
    const enterpriseName = (orgRaw.name as string) || "未知企业";
    const caseName = (raw.title as string) || `${enterpriseName} 人工智能应用案例`;
    const techPath = safeArray<string>(raw.techPath);
    const miitDirection = (raw.miitDirection as string) || "行业赋能方向";
    const miitRecommender = (raw.miitRecommender as string) || "省级主管部门";
    const miitNoticeId = (raw.miitNoticeId as string) || "工信厅科函〔2026〕340号";
    const miitIndustryName = ((raw.industry as RawCase)?.name as string) || "";
    const rawScenarios = safeArray<RawCase>(raw.scenarios);

    // 合并文本用于“其他行业/专项应用”的内容再细分
    const blob = [
      enterpriseName,
      caseName,
      (raw.summary as string) || "",
      (raw.problem as string) || "",
      (raw.solution as string) || "",
      ...techPath,
      miitDirection,
      miitIndustryName,
    ].join(" ");

    const industrySlug = deriveIndustrySlug(miitIndustryName, blob);
    const indMeta = INDUSTRY_META[industrySlug];
    const scenarioSlugs = deriveScenarioSlugs(rawScenarios);
    const scenarioObjs = scenarioSlugs.map((s) => SCENARIO_CATALOG[s]).filter(Boolean);
    const scenario = scenarioObjs[0];

    const publishedAt = toIso(raw.publishedAt as string);
    const updatedAt = toIso(raw.updatedAt as string);

    const summary = (raw.summary as string) || caseName;
    const background = (raw.background as string) || `${enterpriseName}（${miitDirection}）申报的 2025 年人工智能应用典型案例，由 ${miitRecommender} 推荐。`;
    const problem = (raw.problem as string) || "企业在该业务场景中面临效率、成本或质量方面的挑战，需借助人工智能技术进行优化。";
    const solution = (raw.solution as string) || caseName;

    const sources = safeArray<RawCase>(raw.sources).map((s, si) => ({
      id: `src-${id}-${si}`,
      title: (s.title as string) || "公开资料",
      publisher: (s.publisher as string) || "公开资料",
      type: "web",
      url: (s.originalUrl as string) || (s.url as string) || undefined,
      publishedAt: undefined,
      collectedAt: new Date().toISOString(),
      accessibility: "available",
      supports: ["summary", "background"],
    }));

    const orgType = (orgRaw.type as "soe" | "private" | "foreign" | "sme") || "private";

    records.push({
      id,
      version: 1,
      slug,
      title: caseName,
      organization: {
        id: (orgRaw.id as string) || `org-${i}`,
        name: enterpriseName,
        size: (orgRaw.size as string) || "未披露",
        region: (orgRaw.region as string) || undefined,
        anonymous: false,
        type: orgType,
      },
      industry: {
        id: indMeta.id,
        code: indMeta.code,
        name: indMeta.name,
        displayName: indMeta.displayName,
        slug: industrySlug,
        description: indMeta.description,
        icon: indMeta.icon,
        featured: true,
        standardVersion: "GB/T 4754-2017+1",
      },
      scenarios: scenarioObjs,
      businessFunctions: safeArray<string>(orgRaw.businessFunctions).length
        ? safeArray<string>(orgRaw.businessFunctions)
        : [miitDirection],
      summary,
      background,
      problem,
      solution,
      implementationSteps: safeArray<string>(raw.implementationSteps).length ? safeArray<string>(raw.implementationSteps) : ["申报与方案设计", "系统建设与试点", "规模化应用"],
      duration: (raw.duration as string) || "未披露",
      cost: (raw.cost as string) || "未披露",
      results: safeArray<RawCase>(raw.results).map((r, ri) => ({
        id: `m-${id}-${ri}`,
        label: (r.label as string) || "成效指标",
        value: (r.value as string) || "未披露",
        baseline: (r.baseline as string) || undefined,
        unit: (r.unit as string) || undefined,
        improvement: (r.improvement as string) || undefined,
        sourceId: (r.sourceId as string) || undefined,
        kind: ((r.kind as string) || "undisclosed") as "actual" | "expected" | "estimated" | "undisclosed",
      })),
      roi: (raw.roi as string) || "未披露",
      risks: (raw.risks as string) || "未披露",
      editorComment: {
        suitableFor: `同属${indMeta.displayName}领域、希望落地人工智能应用的企业`,
        prerequisites: "具备相应业务数据与数字化基础",
        priority: "建议优先",
        text: "工业和信息化部办公厅公布的 2025 年人工智能应用典型案例，具有权威性与代表性。",
      },
      implementers: safeArray<RawCase>(raw.implementers).map((im) => ({
        name: (im.name as string) || "未披露",
        role: (im.role as string) || undefined,
        website: (im.website as string) || undefined,
      })),
      outcomeStatus: "success",
      contentStatus: "published",
      confidence: "high",
      sources,
      featured: false,
      views: 0,
      publishedAt,
      updatedAt,
      demo: false,
      implementationYear: 2025,
      implementationTimePrecision: "year",
      painPointTags: techPath.length ? techPath : [miitDirection],
      painPointNarrative: problem,
      highlight:
        (raw.highlight as string)?.trim() &&
        (raw.highlight as string).trim() !== summary.trim()
          ? (raw.highlight as string).trim()
          : undefined,
      techPath,
      modelStack: safeArray<string>(raw.modelStack),
      applicationField: miitDirection,
      sourceReport: {
        title: "工业和信息化部办公厅关于公布 2025 年人工智能应用典型案例的通知",
        publisher: "中华人民共和国工业和信息化部办公厅",
        year: 2026,
      },
      miitDirection,
      miitRecommender,
      miitNoticeId,
      ctaText: "查看该方向落地方案",
      tags: [miitDirection, miitRecommender, ...techPath],
      seo: {
        metaTitle: `${caseName}｜2025年人工智能应用典型案例`,
        metaDescription: summary,
        keywords: [enterpriseName, miitDirection, ...techPath],
      },
    });
  }

  const db = await getDb();
  const coll = db.collection("cases");

  const delRes = await coll.deleteMany({ _id: { $exists: true } });
  console.log(`[import] 已删除旧记录数: ${delRes.deletedCount ?? 0}`);

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await coll.insertMany(batch);
    inserted += batch.length;
    process.stdout.write(`\r[import] 已插入 ${Math.min(i + BATCH, records.length)}/${records.length}`);
  }
  console.log(`\n[import] 完成：共插入 ${inserted} 条`);

  const total = await coll.countDocuments({});
  console.log(`[import] cases 集合总数: ${total}`);

  // 行业分布抽样校验
  const dist: Record<string, number> = {};
  const all = await coll.find({}).project({ "industry.slug": 1, _id: 0 }).toArray();
  for (const d of all) {
    const s = (d.industry && d.industry.slug) || "none";
    dist[s] = (dist[s] || 0) + 1;
  }
  console.log("[import] 行业分布:", JSON.stringify(dist));
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("[import] 失败:", e);
    process.exit(1);
  },
);
