import type { AssessmentReport } from "@/lib/types";

export interface AssessmentInput {
  industry: string; size: string; business: string; repeatedWork: string; systems: string;
  volume: string; laborCost: string; budget: string; urgency: string; goal: string; followUp?: string;
}

const scenarioByText = [
  { words: ["录入", "单据", "发票", "合同", "表格"], scenario: "OCR 与智能录单", title: "先把高频单据录入自动化" },
  { words: ["客服", "咨询", "问答", "工单"], scenario: "智能客服", title: "建立可控的智能客服辅助" },
  { words: ["知识", "文档", "制度", "培训", "查找"], scenario: "企业知识库", title: "建设可追溯的企业知识库" },
  { words: ["报价", "询价", "销售", "跟进"], scenario: "销售与报价辅助", title: "把报价与销售准备标准化" },
  { words: ["质检", "缺陷", "图片", "检测"], scenario: "智能质检", title: "从辅助质检小范围验证" },
];

export function createFallbackReport(id: string, input: AssessmentInput): AssessmentReport {
  const text = `${input.business} ${input.repeatedWork} ${input.goal}`;
  const match = scenarioByText.find((item) => item.words.some((word) => text.includes(word))) ?? { scenario: "流程自动化", title: "先选择一个高频重复流程验证" };
  const monthlySaving = input.laborCost || "需补充人工工时与单价后估算";
  const recommendations: AssessmentReport["recommendations"] = [
    { title: match.title, stage: 1, scenario: match.scenario, reason: `“${input.repeatedWork}”是当前最清晰的重复工作入口，适合先用小范围数据验证。`, prerequisites: ["明确当前流程基线", "准备 30–100 份脱敏样本", "指定一名业务负责人"], impact: "高", difficulty: "低", investment: input.budget || "小额验证预算", timeline: "2–4 周验证" },
    { title: "沉淀数据与知识规则", stage: 2, scenario: "企业知识库", reason: "把首阶段使用的资料、口径和异常处理方式沉淀下来，降低后续扩展成本。", prerequisites: ["资料归属清晰", "建立更新责任人", "定义权限边界"], impact: "中", difficulty: "中", investment: "视资料规模评估", timeline: "4–8 周" },
    { title: "连接现有系统形成闭环", stage: 3, scenario: "Workflow / Agent", reason: `在 ${input.systems || "现有业务系统"} 基础上打通输入、判断与回写，避免形成新的信息孤岛。`, prerequisites: ["前两阶段指标达标", "系统接口可用", "人工兜底流程明确"], impact: "高", difficulty: "高", investment: "需在接口梳理后评估", timeline: "8–16 周" },
  ];
  const diagnosis = `${input.industry || "所在行业"}、${input.size || "当前规模"}的企业，更适合从边界清楚、频率高、可人工复核的工作切入。当前建议优先验证“${input.repeatedWork}”，暂不建议一开始就建设覆盖全公司的通用 Agent。`;
  const roi = { initialInvestment: input.budget || "需补充预算", monthlyCost: "需根据模型调用量和人工审核量估算", monthlySaving, paybackPeriod: "约 6–12 个月（AI 推测区间）", confidence: "低" as const, basis: "ai-estimate" as const, assumptions: ["按当前业务量稳定计算", "自动化后仍保留必要人工复核", "未计入流程改造和系统接口的隐性成本", "实际节省取决于使用率和错误率"], disclaimer: "该区间基于问诊输入与行业经验推测，不构成效果承诺。" };
  const markdown = `## 核心判断\n\n${diagnosis}\n\n## 优先建议\n\n${recommendations.map((item) => `### 第 ${item.stage} 阶段：${item.title}\n\n${item.reason}\n\n- 预计周期：${item.timeline}\n- 投入参考：${item.investment}`).join("\n\n")}\n\n## ROI 估算\n\n预计回收期：${roi.paybackPeriod}。\n\n> ${roi.disclaimer}`;
  return { id, sessionId: id, companyProfile: `${input.industry} · ${input.size} · ${input.business}`, diagnosis, recommendations, roi, notRecommended: ["没有统一数据口径时直接做跨部门 Agent", "未定义人工兜底就完全替代关键岗位", "用一次性 Demo 结果代替持续运营指标"], actionPlan: ["记录当前流程用时、错误率和月业务量", "选择一个部门和一名负责人", "准备脱敏样本并定义验收指标", "用 2–4 周完成小范围验证", "达标后再评估系统集成"], relatedCaseSlugs: [], markdown, aiGenerated: false, createdAt: new Date().toISOString() };
}
