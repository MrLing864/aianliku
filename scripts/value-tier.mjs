// 案例价值分级（与 src/lib/value-tier.ts 保持逻辑一致）
//
// 综合得分 = round(0.5 * 降本增收规模 + 0.3 * 行业标杆性 + 0.2 * 对访客参考意义)
// 各子项取值 0-100，综合得分映射到分级：
//   extreme(极高) >= 80 | high(高) >= 60 | medium(中) >= 40 | low(低) < 40
//
// 入参为 CaseStudy 对象（来自 JSON 或数据库），返回 { tier, score, subs }。

const BENEFIT_WEIGHT = 0.5;
const BENCHMARK_WEIGHT = 0.3;
const REFERENCE_WEIGHT = 0.2;

const TIERS = [
  { tier: "extreme", min: 75, label: "价值极高" },
  { tier: "high", min: 60, label: "价值高" },
  { tier: "medium", min: 40, label: "价值中" },
  { tier: "low", min: 0, label: "价值低" },
];

const MONEY_KEYWORDS =
  /营收|收入|利润|成本|收益|销售额|产值|节约|降本|增收|投资|回报|费用|金额|资金|产值|经费|英镑|美元|人民币|欧元|日元|港元/;
const CURRENCY_TOKENS = /[￥$¥€£]|人民币|美元|英镑|欧元|日元|港元|RMB|CNY|USD|GBP|EUR|JPY|HKD/i;

function toText(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => (typeof p === "string" ? p : JSON.stringify(p)))
    .join(" ");
}

// 从文本中提取最大的金额量级（人民币近似），仅在具备货币语境时计入。
function parseMoneyMax(text) {
  if (!text) return 0;
  const lower = String(text);
  const hasMoneyContext = MONEY_KEYWORDS.test(lower) || CURRENCY_TOKENS.test(lower);
  if (!hasMoneyContext) return 0;

  let max = 0;
  // 中文：数字 + (十|百|千)? + (亿|万)
  const cn = /(\d+(?:\.\d+)?)\s*(十|百|千)?\s*(亿|万)/g;
  let m;
  while ((m = cn.exec(lower)) !== null) {
    const num = parseFloat(m[1]);
    const prefix = { 十: 10, 百: 100, 千: 1000 }[m[2]] || 1;
    const unit = { 万: 1e4, 亿: 1e8 }[m[3]] || 1;
    max = Math.max(max, num * prefix * unit);
  }
  // 英文：数字 + (billion|million|thousand|k)
  const en = /(\d+(?:\.\d+)?)\s*(billion|million|thousand|k)\b/gi;
  while ((m = en.exec(lower)) !== null) {
    const num = parseFloat(m[1]);
    const unit = { billion: 1e9, million: 1e6, thousand: 1e3, k: 1e3 }[m[2].toLowerCase()] || 1;
    max = Math.max(max, num * unit);
  }
  return max;
}

function parsePercentBonus(text) {
  if (!text) return 0;
  let bonus = 0;
  const re = /([+-]?\d+(?:\.\d+)?)\s*%/g;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    const val = Math.abs(parseFloat(m[1]));
    if (val >= 50) bonus = Math.max(bonus, 20);
    else if (val >= 20) bonus = Math.max(bonus, 12);
    else if (val >= 5) bonus = Math.max(bonus, 6);
  }
  return bonus;
}

const BENEFIT_KEYWORDS = /提升|提高|降低|下降|节约|增收|提效|增效|优化|减少|加快|缩短|降本|增长|效率|显著|大幅/;

function benefitFromText(text) {
  if (!text) return 0;
  const t = String(text);
  if (!BENEFIT_KEYWORDS.test(t)) return 0;
  if (/大幅|显著|十倍|翻倍|成倍|数倍|千万级|百万级|亿级|十亿级|倍级/.test(t)) return 70;
  return 50;
}

function scoreBenefit(c) {
  const resultsText = toText(
    c.roi,
    c.cost,
    c.results?.map((r) => toText(r.value, r.improvement, r.baseline, r.unit)),
    c.investmentRange?.narrative,
  );
  const maxMoney = parseMoneyMax(resultsText);

  let score = 0;
  if (maxMoney >= 1e9) score = 100;
  else if (maxMoney >= 1e8) score = 88;
  else if (maxMoney >= 1e7) score = 70;
  else if (maxMoney >= 1e6) score = 55;
  else if (maxMoney >= 1e5) score = 40;
  else if (maxMoney >= 1e4) score = 30;
  else if (maxMoney > 0) score = 25;

  // 量化提升幅度（如 +30%）直接给到 55 分起
  const improvementText = toText(c.results?.map((r) => r.improvement));
  const impBonus = parsePercentBonus(improvementText);
  if (impBonus > 0) score = Math.max(score, 55 + impBonus);

  // 定性收益描述（提效 / 降本 / 增收 等）
  const qualText = toText(c.roi, c.cost, c.highlight, c.results?.map((r) => r.value), c.background, c.solution);
  const qual = benefitFromText(qualText);
  if (qual > 0) score = Math.max(score, qual);

  // 结果状态约束：失败/未披露时价值不夸大
  if (c.outcomeStatus === "failure") score = Math.min(score, 40);
  if (c.outcomeStatus === "undisclosed") score = Math.min(score, 55);

  return Math.max(0, Math.min(100, score));
}

function scoreBenchmark(c) {
  let score = 15;
  if (c.featured) score += 30;
  const priority = c.editorComment?.priority;
  if (priority === "建议优先") score += 25;
  else if (priority === "条件具备后开展") score += 10;
  if (c.industry?.featured) score += 10;
  if (c.organization?.type === "soe") score += 10;
  const size = c.organization?.size ?? "";
  if (size.includes("1000人以上") || size.includes("501–1000") || size.includes("501-1000")) score += 5;
  if (c.testimonial) score += 10;
  return Math.max(0, Math.min(100, score));
}

function scoreReference(c) {
  let score = 10;
  if (c.background && String(c.background).length > 40) score += 15;
  if (c.solution && String(c.solution).length > 40) score += 15;
  if (Array.isArray(c.implementationSteps) && c.implementationSteps.length >= 3) score += 10;
  if (Array.isArray(c.results) && c.results.length >= 2) score += 10;
  if (c.confidence === "high") score += 20;
  else if (c.confidence === "medium") score += 10;
  if (c.sourceReport) score += 10;
  if (Array.isArray(c.painPointTags) && c.painPointTags.length > 0) score += 5;
  const views = Number(c.views) || 0;
  if (views >= 1000) score += 15;
  else if (views >= 200) score += 10;
  else if (views >= 50) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function computeValueTier(c) {
  const benefit = scoreBenefit(c);
  const benchmark = scoreBenchmark(c);
  const reference = scoreReference(c);
  const score = Math.round(benefit * BENEFIT_WEIGHT + benchmark * BENCHMARK_WEIGHT + reference * REFERENCE_WEIGHT);
  const tier = (TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]).tier;
  return { tier, score, subs: { benefit, benchmark, reference } };
}

export const VALUE_TIER_LABELS = {
  extreme: "价值极高",
  high: "价值高",
  medium: "价值中",
  low: "价值低",
};
