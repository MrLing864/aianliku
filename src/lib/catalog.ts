import type { Industry, Scenario } from "@/lib/types";

export const industries: Industry[] = [
  {
    id: "industry-manufacturing",
    code: "C",
    name: "制造业",
    displayName: "制造业",
    slug: "manufacturing",
    description: "生产、质检、设备维护、供应链与经营管理中的 AI 实践。",
    icon: "Factory",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-retail",
    code: "F52",
    name: "零售业",
    displayName: "零售与消费",
    slug: "retail",
    description: "选品、库存、门店运营、客服与会员营销案例。",
    icon: "ShoppingBag",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-foreign-trade",
    code: "F51",
    name: "批发业",
    displayName: "外贸与批发",
    slug: "foreign-trade",
    description: "询盘、报价、单证、翻译和跨境客户服务案例。",
    icon: "Globe2",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-logistics",
    code: "G",
    name: "交通运输、仓储和邮政业",
    displayName: "物流与仓储",
    slug: "logistics",
    description: "订单、仓储、路径、调度和运力管理案例。",
    icon: "Truck",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-finance",
    code: "J",
    name: "金融业",
    displayName: "金融",
    slug: "finance",
    description: "风控、合规、运营与知识服务案例。",
    icon: "Landmark",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-healthcare",
    code: "Q84",
    name: "卫生",
    displayName: "医疗健康",
    slug: "healthcare",
    description: "病历、随访、辅助诊疗和医院运营案例。",
    icon: "HeartPulse",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-education",
    code: "P",
    name: "教育",
    displayName: "教育",
    slug: "education",
    description: "教学内容、教务、知识问答和学习支持案例。",
    icon: "GraduationCap",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
  {
    id: "industry-software",
    code: "I65",
    name: "软件和信息技术服务业",
    displayName: "软件与互联网",
    slug: "software-internet",
    description: "研发、运维、客服、销售与内容生产案例。",
    icon: "Code2",
    featured: true,
    standardVersion: "GB/T 4754-2017+1",
  },
];

export const scenarios: Scenario[] = [
  { id: "scene-ocr", name: "OCR / 文档识别", slug: "ocr", description: "从票据、合同、单据和图片提取结构化信息。", synonyms: ["文字识别", "文档识别", "录单"], icon: "ScanText", featured: true },
  { id: "scene-customer-service", name: "智能客服", slug: "customer-service", description: "面向客户或员工的智能问答与工单辅助。", synonyms: ["AI客服", "客服机器人", "在线客服"], icon: "MessagesSquare", featured: true },
  { id: "scene-knowledge", name: "企业知识库", slug: "knowledge-base", description: "让制度、产品和业务资料可检索、可问答。", synonyms: ["知识问答", "RAG", "内部知识库"], icon: "LibraryBig", featured: true },
  { id: "scene-sales", name: "销售辅助", slug: "sales", description: "线索分析、销售跟进、沟通总结和方案生成。", synonyms: ["销售助手", "商机分析", "销售Agent"], icon: "TrendingUp", featured: true },
  { id: "scene-quotation", name: "智能报价", slug: "quotation", description: "根据产品、物料和规则辅助快速、准确报价。", synonyms: ["报价Agent", "自动报价", "报价"], icon: "ReceiptText", featured: true },
  { id: "scene-workflow", name: "流程自动化", slug: "workflow", description: "连接业务系统，减少重复录入和人工流转。", synonyms: ["Workflow", "RPA", "自动化流程"], icon: "Workflow", featured: true },
  { id: "scene-quality", name: "智能质检", slug: "quality-inspection", description: "视觉、语音或文本质量检查和异常识别。", synonyms: ["视觉质检", "AI质检"], icon: "ScanSearch", featured: true },
  { id: "scene-forecast", name: "预测与分析", slug: "forecast", description: "需求、销量、库存、设备和经营指标预测。", synonyms: ["需求预测", "数据分析", "预测性维护"], icon: "ChartNoAxesCombined", featured: false },
  { id: "scene-content", name: "内容生成", slug: "content-generation", description: "营销、商品、培训和多语言内容生产。", synonyms: ["AIGC", "营销文案", "内容创作"], icon: "Sparkles", featured: false },
  { id: "scene-agent", name: "Agent", slug: "agent", description: "能够规划、调用工具并执行多步任务的 AI 助手。", synonyms: ["智能体", "AI Agent"], icon: "Bot", featured: true },
];

export const businessFunctions = ["生产", "质检", "销售", "客服", "采购", "供应链", "财务", "人力", "研发", "经营管理"];

export const sizeBands = ["1–20人", "21–50人", "51–100人", "101–500人", "501–1000人", "1000人以上", "未披露"];

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug);
}

export function getScenario(slug: string) {
  return scenarios.find((scenario) => scenario.slug === slug);
}
