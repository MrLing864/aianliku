// 迁移脚本共用的指纹生成 helper（与 fingerprint.ts 逻辑一致，供 migrate.ts 复用）
export function generateFingerprintFromText(input: {
  title?: string;
  rawText?: string;
  solution?: string;
  result?: string;
  scenarios?: (string | { slug?: string; name?: string })[];
  businessFunctions?: string[];
  organizationId?: string;
}): {
  organizationId?: string;
  projectName: string;
  primaryScenarioSlug?: string;
  businessFunctions: string[];
  businessProcess?: string;
  department?: string;
  implementationLocation?: string;
  implementationYear?: number;
  projectPhase?: string;
  implementers: string[];
  products: string[];
  solutionConcepts: string[];
  metricSignatures: string[];
  sourceKeywords: string[];
  lexicalVector: number[];
  fingerprintVersion: string;
} {
  const text = [input.title, input.rawText, input.solution, input.result].filter(Boolean).join(" ");
  const SCENARIO: Record<string, string[]> = {
    "智能客服": ["客服", "智能客服", "对话", "问答机器人"],
    "质量检测": ["质检", "质量", "缺陷检测", "视觉检测"],
    "智能营销": ["营销", "获客", "推荐", "精准营销"],
    "智能风控": ["风控", "反欺诈", "风险"],
    "智能供应链": ["供应链", "物流", "仓储", "排产"],
    "研发设计": ["研发", "设计", "仿真", "生成式"],
    "智能办公": ["办公", "文档", "合同", "知识库"],
    "生产制造": ["制造", "产线", "设备", "预测性维护"],
  };
  let scenario: string | undefined;
  if (Array.isArray(input.scenarios) && input.scenarios.length) {
    const first = input.scenarios[0];
    scenario = typeof first === "string" ? first : (first?.slug || first?.name);
  } else {
    for (const [slug, kws] of Object.entries(SCENARIO)) {
      if (kws.some((k) => text.includes(k))) { scenario = slug; break; }
    }
  }
  const FUNC = ["客服", "质检", "营销", "风控", "供应链", "研发", "办公", "生产", "财务", "人事", "运维"];
  const DEPT = ["生产", "制造", "质量", "客服", "营销", "供应链", "研发", "财务", "人力", "信息", "运维"];
  const businessFunctions = Array.isArray(input.businessFunctions) ? input.businessFunctions : FUNC.filter((f) => text.includes(f));
  const department = DEPT.find((d) => text.includes(d));
  const metrics = Array.from(new Set((text.match(/([\d]+(?:\.\d+)?\s?(?:%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加))/g) || []).map((m) => m.trim()))).slice(0, 20);
  return {
    organizationId: input.organizationId,
    projectName: input.title || "",
    primaryScenarioSlug: scenario,
    businessFunctions,
    businessProcess: undefined,
    department,
    implementationLocation: undefined,
    implementationYear: undefined,
    projectPhase: undefined,
    implementers: [],
    products: [],
    solutionConcepts: [],
    metricSignatures: metrics,
    sourceKeywords: Array.from(new Set([...(scenario ? [scenario] : []), ...businessFunctions, ...(department ? [department] : [])])),
    lexicalVector: [],
    fingerprintVersion: "dedup-v2",
  };
}
