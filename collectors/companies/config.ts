/**
 * 企业（A 股上市公司）AI 应用案例采集配置。
 * 范围：全部 A 股上市公司（内置头部清单去官网 + 东方财富全量名单搜索发现）。
 */

export const TARGET_YEARS = [2026, 2025, 2024];

/** 每日采集企业上限：每天最多采集 100 家上市公司（按企业计数，非候选数）。 */
export const DAILY_COMPANY_LIMIT = Number(process.env.COMPANY_DAILY_COMPANY_LIMIT || 100);

/** 每日候选上限（搜索发现模式下控制总候选数的安全网，防止极端超额）。 */
export const DAILY_CAP = Number(process.env.COMPANY_DAILY_CAP || 300);

/** 每公司候选上限。 */
export const MAX_CANDIDATES_PER_COMPANY = Number(process.env.COMPANY_PER_COMPANY || 3);

/** 搜索引擎每 query 候选数。 */
export const MAX_CANDIDATES_PER_QUERY = 5;

/** 企业官网内可能含 AI 案例的栏目路径关键词。 */
export const COMPANY_AI_SECTION_PATHS = [
  "/ai",
  "/about/news",
  "/news",
  "/media",
  "/case",
  "/cases",
  "/solution",
  "/solutions",
  "/smart",
  "/digital",
  "/technology",
  "/innovation",
];

/** 搜索引擎 query：公司名 + AI 应用关键词。 */
export function buildSearchQueries(companyName: string, years: number[]): string[] {
  const baseTerms = [
    "人工智能应用案例",
    "大模型应用",
    "AI赋能 数字化",
    "智能体 落地案例",
    "数字化转型 人工智能",
  ];
  const queries: string[] = [];
  for (const year of years) {
    for (const term of baseTerms) {
      queries.push(`${companyName} ${term} ${year}`);
    }
  }
  return queries;
}
