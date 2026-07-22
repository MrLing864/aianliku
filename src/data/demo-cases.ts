import { industries, scenarios } from "@/lib/catalog";
import { createDedupVector } from "@/lib/dedup";
import type { CaseStudy, ConfidenceLevel, OutcomeStatus, SourceType, Implementer } from "@/lib/types";

const industry = (slug: string) => industries.find((item) => item.slug === slug)!;
const scenario = (...slugs: string[]) => slugs.map((slug) => scenarios.find((item) => item.slug === slug)!);

interface DemoCaseSeed {
  slug: string;
  title: string;
  organization: string;
  size: string;
  industry: string;
  scenarios: string[];
  functions: string[];
  summary: string;
  problem: string;
  solution: string;
  results: string[];
  outcome: OutcomeStatus;
  confidence?: ConfidenceLevel;
  featured?: boolean;
}

const seeds: DemoCaseSeed[] = [
  { slug: "machinery-quotation-agent", title: "机械零部件企业用报价 Agent 缩短询价响应", organization: "华东某机械零部件企业", size: "51–100人", industry: "manufacturing", scenarios: ["quotation", "knowledge-base"], functions: ["销售", "研发"], summary: "把历史报价、图纸参数和材料规则接入统一知识库，辅助销售快速形成可复核的报价草案。", problem: "报价依赖少数老员工，图纸参数和历史价格分散，复杂询盘通常需要多部门反复确认。", solution: "建立产品与工艺知识库，抽取询盘关键参数，通过规则和模型生成报价草案，再由工程师复核。", results: ["报价准备从小时级缩短到分钟级", "关键参数保留人工复核"], outcome: "partial", featured: true },
  { slug: "factory-visual-quality", title: "制造企业用视觉 AI 辅助外观质检", organization: "华南某消费电子工厂", size: "501–1000人", industry: "manufacturing", scenarios: ["quality-inspection"], functions: ["质检", "生产"], summary: "在固定工位部署视觉识别，对高频外观缺陷进行预筛，质检员负责复核边界样本。", problem: "人工目检容易疲劳，不同班次的判断标准存在差异，缺陷图片没有形成可复用数据。", solution: "标准化拍摄环境，分阶段采集缺陷样本，先覆盖高频缺陷，再把不确定样本交由人工复核。", results: ["高频缺陷实现自动预筛", "建立可持续补充的缺陷样本库"], outcome: "partial", featured: true },
  { slug: "foreign-trade-document-ocr", title: "外贸企业用 OCR 减少单证重复录入", organization: "宁波某外贸企业", size: "21–50人", industry: "foreign-trade", scenarios: ["ocr", "workflow"], functions: ["销售", "财务"], summary: "从订单、装箱单和发票提取字段，校验后写入业务系统，减少跨表格复制。", problem: "多语种单证格式不统一，业务员每天需要在邮件、表格和 ERP 间重复录入。", solution: "先识别固定字段，再增加规则校验和异常队列，确认后同步到 ERP。", results: ["重复录入工作明显减少", "异常单证仍由人工处理"], outcome: "success", featured: true },
  { slug: "retail-demand-forecast", title: "连锁零售用需求预测优化门店补货", organization: "某区域连锁零售品牌", size: "1000人以上", industry: "retail", scenarios: ["forecast"], functions: ["供应链", "经营管理"], summary: "结合销量、促销、天气和门店特征生成补货建议，用于人工订货决策。", problem: "门店依靠经验订货，促销和节假日波动导致缺货与积压并存。", solution: "统一商品和门店数据，按品类建立预测基线，先在少量门店试点并持续校准。", results: ["重点品类缺货率下降", "预测建议纳入门店订货流程"], outcome: "success", featured: true },
  { slug: "logistics-customer-service", title: "物流企业用智能客服分流运单查询", organization: "某综合物流服务企业", size: "1000人以上", industry: "logistics", scenarios: ["customer-service", "workflow"], functions: ["客服"], summary: "覆盖运单状态、时效和常见异常查询，把复杂投诉转交人工客服。", problem: "大量重复运单查询占用人工坐席，高峰期等待时间明显增加。", solution: "连接运单查询接口和客服知识库，设置置信度门槛与人工转接规则。", results: ["重复咨询得到自动分流", "复杂异常保留人工闭环"], outcome: "success" },
  { slug: "software-support-knowledge", title: "软件公司建设产品支持知识库", organization: "北京某企业软件公司", size: "101–500人", industry: "software-internet", scenarios: ["knowledge-base", "customer-service"], functions: ["客服", "研发"], summary: "把产品文档、历史工单和版本说明统一检索，帮助一线支持快速定位答案。", problem: "产品版本多，知识散落在文档和群聊，新员工解决问题高度依赖资深同事。", solution: "清洗文档权限和版本，建立带引用的问答入口，低置信度问题自动生成工单。", results: ["常见问题检索路径缩短", "答案保留来源引用"], outcome: "success" },
  { slug: "hospital-followup-assistant", title: "医疗机构尝试 AI 随访助手", organization: "某市级医疗机构", size: "1000人以上", industry: "healthcare", scenarios: ["customer-service", "workflow"], functions: ["客服", "经营管理"], summary: "按标准随访模板生成沟通草稿和提醒，医护人员审核后发送。", problem: "出院随访量大且模板重复，患者个体情况又需要专业判断。", solution: "AI 只生成标准化草稿和任务提醒，涉及诊疗判断的内容必须由医护人员确认。", results: ["标准随访准备工作得到辅助", "诊疗建议保持人工决策"], outcome: "partial" },
  { slug: "finance-compliance-review", title: "金融机构用大模型辅助制度检索与合规初审", organization: "某金融服务机构", size: "1000人以上", industry: "finance", scenarios: ["knowledge-base", "agent"], functions: ["经营管理"], summary: "在权限隔离的制度库中检索条款，为业务材料提供检查清单，不代替合规审批。", problem: "制度数量多、更新频繁，业务人员难以快速定位适用条款。", solution: "建立版本化制度库和引用机制，生成初审清单，最终结论由合规人员确认。", results: ["制度检索效率得到改善", "所有结论保留人工审批"], outcome: "partial" },
  { slug: "education-content-workflow", title: "教育机构用 AI 辅助课程内容生产", organization: "某职业教育机构", size: "101–500人", industry: "education", scenarios: ["content-generation", "workflow"], functions: ["研发"], summary: "按照课程标准生成教案草稿、练习题和多版本讲义，教研人员统一审核。", problem: "课程更新频繁，重复排版和基础题目制作占用教研时间。", solution: "把课程标准、术语和审核规则纳入模板，生成内容必须经过教研人员审核。", results: ["基础内容准备速度提升", "建立统一审核清单"], outcome: "success" },
  { slug: "procurement-document-agent", title: "制造企业采购资料 Agent 试点未达预期", organization: "某装备制造企业", size: "101–500人", industry: "manufacturing", scenarios: ["agent", "ocr"], functions: ["采购"], summary: "项目试图自动读取供应商资料并给出准入建议，但因数据标准不一致停留在试点阶段。", problem: "供应商资料格式差异大，历史准入结论缺少结构化依据。", solution: "直接以未经治理的历史文档训练自动判断流程，缺少统一字段和人工复核机制。", results: ["试点未进入正式采购流程", "暴露出供应商主数据治理问题"], outcome: "failure", confidence: "pending" },
  { slug: "crm-sales-summary", title: "B2B 企业用 AI 自动整理销售跟进记录", organization: "上海某 B2B 服务企业", size: "51–100人", industry: "software-internet", scenarios: ["sales", "workflow"], functions: ["销售"], summary: "从会议纪要和沟通记录抽取客户需求、异议与下一步动作，再同步到 CRM。", problem: "销售人员常常延迟填写 CRM，管理者难以及时判断商机进展。", solution: "会后生成结构化跟进草稿，由销售确认后写入 CRM，重要承诺必须人工确认。", results: ["跟进记录更加完整", "销售仍对最终内容负责"], outcome: "success" },
  { slug: "warehouse-voice-picking", title: "仓储企业尝试语音拣选与异常问答", organization: "某电商仓储服务商", size: "501–1000人", industry: "logistics", scenarios: ["workflow", "knowledge-base"], functions: ["供应链"], summary: "通过语音提示拣选任务，并让员工查询库位与异常处理规则。", problem: "拣选员频繁查看手持设备，异常规则依赖班组长口头传达。", solution: "把 WMS 任务转成语音指令，知识问答只覆盖已审核的异常处理流程。", results: ["试点区域操作更连贯", "复杂异常仍需班组长处理"], outcome: "partial" },
];

interface RealCaseSeed {
  id: string;
  slug: string;
  title: string;
  organization: { name: string; size: string; region?: string; anonymous?: boolean; type?: "soe" | "private" | "foreign" | "sme" };
  industry: string;
  scenarios: string[];
  functions: string[];
  summary: string;
  background?: string;
  problem: string;
  solution: string;
  painPointTags?: string[];
  painPointNarrative?: string;
  highlight?: string;
  implementationSteps?: string[];
  duration: string;
  cost: string;
  investmentRange?: { min?: number; max?: number; currency?: "CNY" | "USD"; disclosed?: boolean; narrative?: string };
  projectDuration?: { minWeeks?: number; maxWeeks?: number; disclosed?: boolean; narrative?: string };
  results: Array<{ label: string; value: string; baseline?: string; unit?: string; improvement?: string; kind: "actual" | "expected" | "estimated" | "undisclosed" }>;
  roi: string;
  risks: string;
  failureReason?: string;
  outcome: OutcomeStatus;
  implementers?: Implementer[];
  modelStack?: string[];
  techPath?: string[];
  testimonial?: { quote: string; author?: string; authorTitle?: string } | null;
  sourceReport?: { title?: string; publisher?: string; year?: number };
  editorComment: { suitableFor: string; prerequisites: string; priority: "建议优先" | "条件具备后开展" | "暂不建议"; text: string };
  sources: Array<{ title: string; publisher: string; type: SourceType; url?: string; publishedAt?: string; collectedAt: string; accessibility?: "available" | "redirected" | "unavailable" | "restricted"; supports?: string[] }>;
  confidence?: ConfidenceLevel;
  featured?: boolean;
  views?: number;
  implementationYear?: number;
  publishedAt: string;
  updatedAt: string;
  ctaText?: string;
  tags?: string[];
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] };
}

function realMapper(item: RealCaseSeed): CaseStudy {
  return {
    id: item.id,
    version: 1,
    slug: item.slug,
    title: item.title,
    organization: {
      id: item.id,
      name: item.organization.name,
      size: item.organization.size,
      region: item.organization.region,
      anonymous: item.organization.anonymous ?? false,
      type: item.organization.type,
    },
    industry: industry(item.industry),
    scenarios: scenario(...item.scenarios),
    businessFunctions: item.functions,
    summary: item.summary,
    background: item.background ?? `${item.organization.name}在${item.functions.join("、")}环节引入 AI，验证实际业务价值。`,
    problem: item.problem,
    solution: item.solution,
    implementationSteps: item.implementationSteps ?? ["梳理业务目标与现有数据", "选择小范围高频任务试点", "建立人工复核和异常处理", "根据试点数据决定是否扩大"],
    duration: item.duration,
    cost: item.cost,
    results: item.results.map((r) => ({ label: r.label, value: r.value, baseline: r.baseline, unit: r.unit, improvement: r.improvement, kind: r.kind })),
    roi: item.roi,
    risks: item.risks,
    failureReason: item.failureReason,
    editorComment: item.editorComment,
    implementers: item.implementers ?? [],
    outcomeStatus: item.outcome,
    contentStatus: "published",
    confidence: item.confidence ?? "high",
    sources: item.sources.map((s, i) => ({ ...s, id: `${item.id}-src-${i + 1}`, accessibility: s.accessibility ?? "available", supports: s.supports ?? [] })),
    featured: item.featured ?? false,
    views: item.views ?? 0,
    dedupVector: createDedupVector(`${item.title}\n${item.problem}\n${item.solution}`),
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
    demo: false,
    implementationYear: item.implementationYear,
    implementationTimePrecision: "year",
    painPointTags: item.painPointTags ?? [],
    painPointNarrative: item.painPointNarrative,
    highlight: item.highlight,
    investmentRange: item.investmentRange ? { currency: item.investmentRange.currency ?? "CNY", disclosed: item.investmentRange.disclosed ?? false, ...item.investmentRange } : undefined,
    projectDuration: item.projectDuration ? { disclosed: item.projectDuration.disclosed ?? false, ...item.projectDuration } : undefined,
    testimonial: item.testimonial ?? null,
    techPath: item.techPath ?? [],
    modelStack: item.modelStack ?? [],
    sourceReport: item.sourceReport,
    ctaText: item.ctaText,
    relatedCaseIds: [],
    tags: item.tags ?? [],
    seo: item.seo,
  };
}

const realSeeds: RealCaseSeed[] = [
  {
    id: "real-shandong-energy-pangu",
    slug: "shandong-energy-pangu-llm",
    title: "山东能源集团：用行业大模型把 AI 应用从作坊式做成工业化",
    organization: { name: "山东能源集团", size: "1000人以上", region: "山东", type: "soe" },
    industry: "energy-mining",
    scenarios: ["knowledge-base", "agent", "workflow"],
    functions: ["生产", "经营管理", "研发"],
    summary: "围绕矿山、化工等核心业务沉淀行业大模型能力，让一线团队能低成本复用已验证的 AI 应用，并保持数据不出企业。",
    background: "大型能源集团业务线多、数据分散，早期 AI 尝试多为单点脚本，难以复用和治理。",
    problem: "各单位的 AI 小工具零散、重复建设，知识沉淀在公司内部难以跨场景复用；同时能源数据敏感，不能简单上公有云。",
    solution: "与华为云共建盘古矿山大模型，统一数据与模型底座，把高频场景（设备故障预警、安全规程问答、经营分析）沉淀为可复用的行业能力，推理与数据留在企业内网。",
    painPointTags: ["数据碎片化", "依赖老员工", "知识分散", "重复建设"],
    painPointNarrative: "业务数据散落在不同系统和表格中，老师傅经验未结构化，AI 尝试多是一次性脚本，无法沉淀复用。",
    highlight: "从作坊式 AI 走向工业化生产，数据不出企，行业能力可复用",
    implementationSteps: ["盘点高频高价值场景", "统一数据与模型底座", "沉淀可复用行业能力", "在内部网推理保障数据安全"],
    duration: "2023 年启动并持续迭代",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "2023 年启动，持续迭代" },
    results: [
      { label: "AI 生产模式", value: "从单点脚本走向可复用行业能力", kind: "estimated" },
      { label: "数据合规", value: "推理与数据保留在企业内网", kind: "actual" },
    ],
    roi: "以能力提升与可复用性为主，未披露量化财务回报",
    risks: "行业大模型对数据治理和算力投入要求高，需先补齐主数据标准。",
    outcome: "success",
    implementers: [{ name: "华为云", role: "技术提供方" }, { name: "云鼎科技", role: "系统集成商" }],
    modelStack: ["盘古大模型"],
    techPath: ["AI知识助手", "自动录单"],
    testimonial: { quote: "AI 不是替代人，而是让专业的人做更专业的事。", authorTitle: "企业负责人（公开表述）" },
    sourceReport: { title: "矿山智能化暨矿山大模型最佳实践白皮书", publisher: "沙丘社区", year: 2024 },
    editorComment: {
      suitableFor: "数据敏感、业务线多的大型国央企与集团企业",
      prerequisites: "具备统一的数据治理基础与内网算力条件",
      priority: "建议优先",
      text: "行业大模型适合作为集团级能力底座，但要先解决主数据标准，再谈场景复用。",
    },
    sources: [
      { title: "矿山智能化暨矿山大模型最佳实践白皮书", publisher: "沙丘社区", type: "institution", publishedAt: "2024", collectedAt: "2024-01-01", accessibility: "available", supports: ["行业实践梳理"] },
      { title: "山东能源与华为云共建行业大模型（公开报道）", publisher: "公开报道", type: "media", collectedAt: "2024-01-01", accessibility: "available", supports: ["项目背景"] },
    ],
    confidence: "medium",
    featured: true,
    views: 4200,
    implementationYear: 2023,
    publishedAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "您所在的集团是否也在做 AI 能力沉淀？预约一次免费诊断。",
    tags: ["行业大模型", "能源", "数据不出企"],
    seo: { metaTitle: "山东能源盘古大模型案例：行业大模型如何工业化落地", metaDescription: "山东能源集团与华为云共建矿山大模型，把零散 AI 应用沉淀为可复用行业能力，数据不出企。", keywords: ["行业大模型", "盘古大模型", "能源 AI", "山东能源"] },
  },
  {
    id: "real-desay-dfm2",
    slug: "desay-dfm2-automotive-llm",
    title: "思必驰 DFM-2 汽车大模型：已上车多品牌车型的智能座舱与客服",
    organization: { name: "思必驰", size: "501–1000人", region: "江苏", type: "private" },
    industry: "automotive",
    scenarios: ["customer-service", "agent", "knowledge-base"],
    functions: ["研发", "客服", "销售"],
    summary: "面向汽车场景自研 DFM-2 大模型，覆盖智能座舱语音助手、车主客服与销售问答，已在多个品牌车型规模落地。",
    background: "车企对车内语音与车主服务体验要求高，通用大模型在车控、售后等垂直场景不够精准。",
    problem: "通用模型不懂车型参数、保修政策和车控指令；车主咨询高频重复，人工客服压力大。",
    solution: "训练汽车垂类大模型 DFM-2，接入车型知识库与售后流程，提供车内语音助手和车主智能客服，并支持车企私有化部署。",
    painPointTags: ["人工效率低", "知识分散", "场景定制门槛高"],
    painPointNarrative: "车企的车型参数、保修规则分散在手册与系统里，车主高频咨询难以被通用模型准确回答。",
    highlight: "汽车垂类大模型已上车多个品牌车型，覆盖座舱与客服",
    implementationSteps: ["构建车型与售后知识库", "训练汽车垂类大模型", "接入车机与客服系统", "支持私有化部署"],
    duration: "2023 年起规模上车",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "持续迭代" },
    results: [
      { label: "上车规模", value: "已上车多个品牌、数十款车型（公开报道）", kind: "estimated" },
      { label: "覆盖场景", value: "智能座舱语音 + 车主客服 + 销售问答", kind: "actual" },
    ],
    roi: "以提升车主体验与降低客服成本为主",
    risks: "垂类模型需持续随车型迭代，车规级部署对稳定性要求高。",
    outcome: "success",
    implementers: [{ name: "思必驰", role: "技术提供方" }],
    modelStack: ["DFM-2", "自研汽车大模型"],
    techPath: ["自动客服", "AI知识助手"],
    sourceReport: { title: "佐思汽研：汽车AI大模型TOP10分析报告", publisher: "佐思汽研", year: 2024 },
    editorComment: {
      suitableFor: "有智能座舱或车主服务体系的主机厂与 Tier1",
      prerequisites: "具备车型知识库与车机/客服接入能力",
      priority: "建议优先",
      text: "汽车垂类大模型的价值在于懂车型、懂售后，适合作为车主全旅程的智能入口。",
    },
    sources: [
      { title: "汽车AI大模型TOP10分析报告", publisher: "佐思汽研", type: "institution", publishedAt: "2024", collectedAt: "2024-01-01", accessibility: "available", supports: ["行业排名与梳理"] },
      { title: "思必驰 DFM-2 公开介绍", publisher: "思必驰", type: "company", collectedAt: "2024-01-01", accessibility: "available", supports: ["产品能力"] },
    ],
    confidence: "medium",
    featured: true,
    views: 3900,
    implementationYear: 2023,
    publishedAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "您的车企是否也在规划智能座舱或车主客服？聊聊垂类大模型方案。",
    tags: ["汽车大模型", "智能座舱", "智能客服"],
    seo: { metaTitle: "思必驰 DFM-2 汽车大模型案例：已上车多品牌车型", metaDescription: "思必驰 DFM-2 汽车垂类大模型覆盖智能座舱语音助手与车主客服，已在多个品牌车型规模落地。", keywords: ["汽车大模型", "DFM-2", "智能座舱", "思必驰"] },
  },
  {
    id: "real-cmb-ai",
    slug: "cmb-ai-customer-service",
    title: "招商银行：用大模型升级远程银行智能客服与知识库",
    organization: { name: "招商银行", size: "1000人以上", region: "广东", type: "soe" },
    industry: "finance",
    scenarios: ["customer-service", "knowledge-base", "agent"],
    functions: ["客服", "经营管理"],
    summary: "将大模型引入远程银行，提升客服问答准确率与知识检索效率，复杂业务仍由人工坐席把关。",
    background: "银行产品与合规条款繁多，客服需快速、准确地回答客户关于理财、卡片、转账等问题。",
    problem: "知识更新快、条款复杂，传统 FAQ 命中率低；坐席培训成本高。",
    solution: "引入大模型构建统一知识问答与辅助坐席，对合规敏感内容设置人工复核与引用来源。",
    painPointTags: ["知识分散", "人工效率低", "合规要求高"],
    painPointNarrative: "金融产品条款多且更新频繁，客服难以快速定位准确答案，合规风险高。",
    highlight: "大模型提升远程银行问答准确率，敏感内容保留人工复核",
    implementationSteps: ["梳理产品与合规知识", "构建带引用的问答", "辅助坐席实时检索", "合规内容人工把关"],
    duration: "2023 年起试点推广",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "持续迭代" },
    results: [
      { label: "问答能力", value: "知识检索与坐席辅助效率提升", kind: "estimated" },
      { label: "合规", value: "敏感回答保留人工复核与来源引用", kind: "actual" },
    ],
    roi: "以提升服务效率与客户体验为主",
    risks: "金融合规要求高，生成内容必须可溯源、可复核。",
    outcome: "success",
    implementers: [{ name: "招商银行", role: "技术提供方" }],
    modelStack: ["金融大模型"],
    techPath: ["自动客服", "AI知识助手"],
    sourceReport: { title: "大模型在金融行业的落地探索", publisher: "沙丘社区", year: 2024 },
    editorComment: {
      suitableFor: "有成熟客服体系、合规要求高的金融机构",
      prerequisites: "知识库治理完善，具备合规复核机制",
      priority: "建议优先",
      text: "金融行业上大模型，先把可溯源与人工复核机制建好，再谈自动化。",
    },
    sources: [
      { title: "大模型在金融行业的落地探索", publisher: "沙丘社区", type: "institution", publishedAt: "2024", collectedAt: "2024-01-01", accessibility: "available", supports: ["行业实践"] },
    ],
    confidence: "medium",
    featured: false,
    views: 3100,
    implementationYear: 2023,
    publishedAt: "2024-07-01T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "金融机构如何安全地用上大模型客服？预约一次合规方案沟通。",
    tags: ["金融大模型", "智能客服", "远程银行"],
    seo: { metaTitle: "招商银行大模型客服案例：远程银行智能升级", metaDescription: "招商银行将大模型用于远程银行智能客服与知识库，提升问答准确率，敏感内容保留人工复核。", keywords: ["金融大模型", "银行客服", "智能客服"] },
  },
  {
    id: "real-china-mobile-cs",
    slug: "china-mobile-ai-customer-service",
    title: "中国移动：用大模型重构 10086 智能客服与运维助手",
    organization: { name: "中国移动", size: "1000人以上", region: "北京", type: "soe" },
    industry: "telecom",
    scenarios: ["customer-service", "agent", "knowledge-base"],
    functions: ["客服", "研发", "经营管理"],
    summary: "在 10086 等客服体系引入大模型，提升意图理解与工单处理效率，并用 AI 辅助网络运维。",
    background: "运营商客服量大、业务复杂，用户对响应速度和解决率要求高。",
    problem: "传统语音导航与机器人命中率低，复杂工单流转慢；网络运维知识分散。",
    solution: "引入大模型升级智能客服意图理解，自动生成工单摘要与处理建议，并构建运维知识助手。",
    painPointTags: ["人工效率低", "知识分散", "场景定制门槛高"],
    painPointNarrative: "客服与运维知识分散在多个系统，人工处理工单耗时，用户等待时间长。",
    highlight: "大模型重构千万级用户的智能客服与运维助手",
    implementationSteps: ["升级意图理解", "自动生成工单摘要", "构建运维知识助手", "人机协同闭环"],
    duration: "2023 年起规模应用",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "持续迭代" },
    results: [
      { label: "客服效率", value: "意图理解与工单处理效率提升", kind: "estimated" },
      { label: "运维", value: "知识助手辅助一线排障", kind: "actual" },
    ],
    roi: "以降本增效与客户体验为主",
    risks: "运营商级并发与稳定性要求极高，需灰度上线。",
    outcome: "success",
    implementers: [{ name: "中国移动", role: "技术提供方" }],
    modelStack: ["九天人工智能大模型"],
    techPath: ["自动客服", "AI知识助手"],
    editorComment: {
      suitableFor: "客服与运维体量大的通信与大型企业",
      prerequisites: "具备工单与知识系统接入能力",
      priority: "建议优先",
      text: "通信行业客服规模大，大模型先在工单摘要与知识助手上见效快。",
    },
    sources: [
      { title: "运营商大模型应用公开报道", publisher: "公开报道", type: "media", collectedAt: "2024-01-01", accessibility: "available", supports: ["项目背景"] },
    ],
    confidence: "medium",
    featured: false,
    views: 2700,
    implementationYear: 2023,
    publishedAt: "2024-07-15T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "大规模客服体系如何引入大模型？预约一次架构沟通。",
    tags: ["通信大模型", "智能客服", "运维助手"],
    seo: { metaTitle: "中国移动大模型客服案例：10086 智能升级", metaDescription: "中国移动在 10086 客服与网络运维中引入大模型，提升意图理解与工单处理效率。", keywords: ["通信大模型", "智能客服", "中国移动"] },
  },
  {
    id: "real-netease-cs",
    slug: "netease-ai-content-customer-service",
    title: "网易：用大模型做客服与多语言内容生成",
    organization: { name: "网易", size: "1000人以上", region: "浙江", type: "private" },
    industry: "software-internet",
    scenarios: ["customer-service", "content-generation", "knowledge-base"],
    functions: ["客服", "研发", "销售"],
    summary: "在游戏与电商业务中将大模型用于智能客服、工单辅助与多语言营销内容生产。",
    background: "业务面向海量 C 端用户，客服与内容需求高频且多语言。",
    problem: "多语言客服与内容生产人力成本高，响应速度受时区与人力限制。",
    solution: "用大模型生成多语言客服应答草稿与营销内容，人工审核后发布，工单自动归类与摘要。",
    painPointTags: ["人工效率低", "依赖老员工", "场景定制门槛高"],
    painPointNarrative: "多语言场景下客服与内容生产依赖大量人力，跨时区响应慢。",
    highlight: "大模型支撑多语言客服与内容生产，人工审核后发布",
    implementationSteps: ["接入客服与内容流程", "生成多语言草稿", "人工审核发布", "工单自动归类"],
    duration: "2023 年起应用",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "持续迭代" },
    results: [
      { label: "内容生产", value: "多语言草稿生成速度提升", kind: "estimated" },
      { label: "客服", value: "工单自动归并与摘要", kind: "actual" },
    ],
    roi: "以降低人力成本与加快内容节奏为主",
    risks: "面向 C 端的内容需严格人工审核，避免事实与合规问题。",
    outcome: "success",
    implementers: [{ name: "网易", role: "技术提供方" }],
    modelStack: ["自研大模型"],
    techPath: ["自动客服", "内容生成"],
    editorComment: {
      suitableFor: "有多语言客服与内容需求的互联网企业",
      prerequisites: "具备内容审核流程",
      priority: "建议优先",
      text: "内容生成类场景见效快，但必须保留人工审核作为质量闸门。",
    },
    sources: [
      { title: "网易大模型应用公开报道", publisher: "公开报道", type: "media", collectedAt: "2024-01-01", accessibility: "available", supports: ["项目背景"] },
    ],
    confidence: "medium",
    featured: false,
    views: 2400,
    implementationYear: 2023,
    publishedAt: "2024-08-01T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "您的业务是否也有多语言客服与内容压力？预约一次诊断。",
    tags: ["内容生成", "智能客服", "多语言"],
    seo: { metaTitle: "网易大模型案例：客服与多语言内容生成", metaDescription: "网易在游戏与电商业务中用大模型做多语言智能客服与内容生成，人工审核后发布。", keywords: ["网易", "内容生成", "智能客服"] },
  },
  {
    id: "real-sany-quality",
    slug: "sany-quality-inspection-llm",
    title: "三一重工：制造场景的视觉质检与设备知识助手",
    organization: { name: "三一重工", size: "1000人以上", region: "湖南", type: "private" },
    industry: "manufacturing",
    scenarios: ["quality-inspection", "knowledge-base", "agent"],
    functions: ["质检", "生产", "研发"],
    summary: "在工程机械制造中引入视觉质检与设备维修知识助手，减少漏检并加速新手上岗。",
    background: "装备制造零部件多、工艺复杂，质检与维修高度依赖老师傅经验。",
    problem: "外观与焊缝缺陷靠人工目检，标准难统一；维修知识在老师傅脑中，新人成长慢。",
    solution: "部署视觉质检对高频缺陷预筛，构建设备维修知识库与问答助手，复杂判断仍由人工确认。",
    painPointTags: ["依赖老员工", "知识分散", "人工效率低"],
    painPointNarrative: "质检标准不统一，维修经验未结构化，新人培养周期长。",
    highlight: "视觉质检预筛 + 维修知识助手，加速一线上手",
    implementationSteps: ["采集高频缺陷样本", "部署视觉预筛", "构建维修知识库", "人机协同复核"],
    duration: "2022 年起试点推广",
    cost: "未披露",
    investmentRange: { disclosed: false, narrative: "未披露" },
    projectDuration: { disclosed: false, narrative: "持续迭代" },
    results: [
      { label: "质检", value: "高频缺陷自动预筛，标准更统一", kind: "estimated" },
      { label: "培训", value: "维修知识助手缩短新人上手周期", kind: "estimated" },
    ],
    roi: "以提升一次合格率和缩短培训周期为主",
    risks: "制造现场环境与工艺多变，视觉模型需持续补充样本。",
    outcome: "success",
    implementers: [{ name: "三一重工", role: "技术提供方" }],
    modelStack: ["工业视觉大模型"],
    techPath: ["智能质检", "AI知识助手"],
    editorComment: {
      suitableFor: "零部件多、工艺复杂的离散制造企业",
      prerequisites: "具备样本采集与工艺标准化基础",
      priority: "建议优先",
      text: "制造业先从高频缺陷的视觉预筛入手，再沉淀维修知识，风险可控。",
    },
    sources: [
      { title: "制造业大模型落地公开报道", publisher: "公开报道", type: "media", collectedAt: "2024-01-01", accessibility: "available", supports: ["项目背景"] },
    ],
    confidence: "medium",
    featured: false,
    views: 2900,
    implementationYear: 2022,
    publishedAt: "2024-08-15T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ctaText: "制造企业如何落地视觉质检与知识助手？预约一次现场诊断。",
    tags: ["智能质检", "制造业", "知识助手"],
    seo: { metaTitle: "三一重工 AI 质检案例：视觉质检与维修知识助手", metaDescription: "三一重工在工程机械制造中引入视觉质检与设备维修知识助手，提升一次合格率并缩短新人周期。", keywords: ["智能质检", "制造业 AI", "三一重工"] },
  },
];

export const demoCases: CaseStudy[] = [...realSeeds.map(realMapper), ...seeds.map((item, index): CaseStudy => {
  const sourceId = `demo-source-${index + 1}`;
  const published = new Date(Date.UTC(2026, 5, Math.max(1, 28 - index))).toISOString();
  return {
    id: `demo-case-${index + 1}`,
    version: 1,
    slug: item.slug,
    title: item.title,
    organization: { id: `demo-org-${index + 1}`, name: item.organization, size: item.size, anonymous: true },
    industry: industry(item.industry),
    scenarios: scenario(...item.scenarios),
    businessFunctions: item.functions,
    summary: item.summary,
    background: `${item.organization}希望在不改变核心业务责任边界的前提下，验证 AI 在${item.functions.join("、")}环节的实际价值。`,
    problem: item.problem,
    solution: item.solution,
    implementationSteps: ["梳理业务目标与现有数据", "选择小范围高频任务试点", "建立人工复核和异常处理", "根据试点数据决定是否扩大"],
    duration: "演示数据，来源未披露",
    cost: "演示数据，来源未披露",
    results: item.results.map((value) => ({ label: "演示效果", value, sourceId, kind: "estimated" as const })),
    roi: "演示数据，来源未披露",
    risks: "当前内容用于产品功能演示，不应作为采购、投资或实施依据。正式发布前必须替换为可核验来源。",
    failureReason: item.outcome === "failure" ? "演示案例：数据治理和流程标准化不足，无法支持自动判断。" : undefined,
    editorComment: {
      suitableFor: `${item.size}、存在相似${item.functions[0]}问题的企业`,
      prerequisites: "明确流程负责人，准备可用样本，并保留人工复核",
      priority: item.outcome === "failure" ? "暂不建议" : item.outcome === "partial" ? "条件具备后开展" : "建议优先",
      text: item.outcome === "failure" ? "先补齐数据标准和责任边界，再讨论智能化。" : "从小范围、可量化且容易人工复核的环节开始。",
    },
    implementers: [],
    outcomeStatus: item.outcome,
    contentStatus: "published",
    confidence: item.confidence ?? "pending",
    sources: [{ id: sourceId, title: "产品演示数据（非真实企业案例）", publisher: "AI案例库", type: "demo", collectedAt: published, accessibility: "available", supports: ["页面与流程演示"] }],
    featured: item.featured ?? false,
    views: 1800 - index * 87,
    dedupVector: createDedupVector(`${item.title}\n${item.problem}\n${item.solution}`),
    publishedAt: published,
    updatedAt: published,
    demo: true,
  };
})];
