import { industries, scenarios } from "@/lib/catalog";
import type { CaseStudy, ConfidenceLevel, OutcomeStatus } from "@/lib/types";

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

export const demoCases: CaseStudy[] = seeds.map((item, index) => {
  const sourceId = `demo-source-${index + 1}`;
  const published = new Date(Date.UTC(2026, 5, Math.max(1, 28 - index))).toISOString();
  return {
    id: `demo-case-${index + 1}`,
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
    publishedAt: published,
    updatedAt: published,
    demo: true,
  };
});
