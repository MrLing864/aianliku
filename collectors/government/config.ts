/**
 * 政府机关 AI 应用案例采集配置
 *
 * 设计要点：
 * - 按省份自动枚举：对每个省/直辖市/自治区构造搜索 query（site:gov.cn + 关键词），
 *   从搜索引擎结果中发现候选详情页 URL。
 * - 权威域名白名单：只有命中白名单的 URL 才允许作为来源（满足"不权威的不要"）。
 *   白名单覆盖 中央/省级/市级政府官网（.gov.cn）、官方媒体、以及部分权威行业机构站。
 */

export interface ProvinceConfig {
  /** 名称，如 "广东省" "江苏省" "北京市" */
  name: string;
  /** 简称，用于构造搜索词，如 "广东" "江苏" "北京" */
  shortName: string;
  /** 该省/市政务域名后缀（用于白名单校验与结果过滤），如 ["gd.gov.cn"] */
  govDomains: string[];
}

/** 全部省级行政区（含直辖市、自治区、特别行政区按需增删）。 */
export const PROVINCES: ProvinceConfig[] = [
  { name: "北京市", shortName: "北京", govDomains: ["beijing.gov.cn", "bjrd.gov.cn"] },
  { name: "上海市", shortName: "上海", govDomains: ["shanghai.gov.cn", "sh.gov.cn"] },
  { name: "天津市", shortName: "天津", govDomains: ["tj.gov.cn"] },
  { name: "重庆市", shortName: "重庆", govDomains: ["cq.gov.cn"] },
  { name: "河北省", shortName: "河北", govDomains: ["hebei.gov.cn"] },
  { name: "山西省", shortName: "山西", govDomains: ["shanxi.gov.cn"] },
  { name: "内蒙古自治区", shortName: "内蒙古", govDomains: ["nmg.gov.cn"] },
  { name: "辽宁省", shortName: "辽宁", govDomains: ["ln.gov.cn"] },
  { name: "吉林省", shortName: "吉林", govDomains: ["jl.gov.cn"] },
  { name: "黑龙江省", shortName: "黑龙江", govDomains: ["hlj.gov.cn"] },
  { name: "江苏省", shortName: "江苏", govDomains: ["jiangsu.gov.cn"] },
  { name: "浙江省", shortName: "浙江", govDomains: ["zj.gov.cn"] },
  { name: "安徽省", shortName: "安徽", govDomains: ["ah.gov.cn"] },
  { name: "福建省", shortName: "福建", govDomains: ["fj.gov.cn"] },
  { name: "江西省", shortName: "江西", govDomains: ["jiangxi.gov.cn"] },
  { name: "山东省", shortName: "山东", govDomains: ["shandong.gov.cn"] },
  { name: "河南省", shortName: "河南", govDomains: ["henan.gov.cn"] },
  { name: "湖北省", shortName: "湖北", govDomains: ["hubei.gov.cn"] },
  { name: "湖南省", shortName: "湖南", govDomains: ["hunan.gov.cn"] },
  { name: "广东省", shortName: "广东", govDomains: ["gd.gov.cn"] },
  { name: "广西壮族自治区", shortName: "广西", govDomains: ["gx.gov.cn"] },
  { name: "海南省", shortName: "海南", govDomains: ["hainan.gov.cn"] },
  { name: "四川省", shortName: "四川", govDomains: ["sc.gov.cn"] },
  { name: "贵州省", shortName: "贵州", govDomains: ["guizhou.gov.cn"] },
  { name: "云南省", shortName: "云南", govDomains: ["yn.gov.cn"] },
  { name: "西藏自治区", shortName: "西藏", govDomains: ["xizang.gov.cn"] },
  { name: "陕西省", shortName: "陕西", govDomains: ["shaanxi.gov.cn"] },
  { name: "甘肃省", shortName: "甘肃", govDomains: ["gansu.gov.cn"] },
  { name: "青海省", shortName: "青海", govDomains: ["qh.gov.cn"] },
  { name: "宁夏回族自治区", shortName: "宁夏", govDomains: ["nx.gov.cn"] },
  { name: "新疆维吾尔自治区", shortName: "新疆", govDomains: ["xj.gov.cn"] },
  // 计划单列市，政府网站独立域名，常发布高质量案例
  { name: "深圳市", shortName: "深圳", govDomains: ["sz.gov.cn"] },
  { name: "厦门市", shortName: "厦门", govDomains: ["xm.gov.cn"] },
  { name: "青岛市", shortName: "青岛", govDomains: ["qingdao.gov.cn"] },
  { name: "大连市", shortName: "大连", govDomains: ["dl.gov.cn"] },
  { name: "宁波市", shortName: "宁波", govDomains: ["ningbo.gov.cn"] },
  { name: "南京市", shortName: "南京", govDomains: ["nanjing.gov.cn", "nanjing.gov.cn"] },
  { name: "杭州市", shortName: "杭州", govDomains: ["hangzhou.gov.cn"] },
  { name: "广州市", shortName: "广州", govDomains: ["gz.gov.cn"] },
  { name: "成都市", shortName: "成都", govDomains: ["chengdu.gov.cn"] },
  { name: "武汉市", shortName: "武汉", govDomains: ["wuhan.gov.cn"] },
  { name: "西安市", shortName: "西安", govDomains: ["xa.gov.cn"] },
];

/**
 * 权威域名白名单（满足"不权威的不要"）。
 * 命中以下任一后缀的 URL 才被接受为信息来源：
 * 1) 任意 .gov.cn 政府官网
 * 2) 中央/官方媒体
 * 3) 科技部/工信部/发改委等国家级政务门户的常见镜像域名
 */
export const AUTHORITY_WHITELIST_SUFFIXES: string[] = [
  ".gov.cn", // 所有政府机关官网
  "people.com.cn", // 人民网
  "xinhuanet.com", // 新华网
  "news.cn", // 新华网
  "gov.cn", // 中央政府门户
  "www.miit.gov.cn", // 工信部
  "www.ndrc.gov.cn", // 发改委
  "www.most.gov.cn", // 科技部
  "www.gov.cn", // 中国政府网
  "ac.cn", // 中科院体系（权威科研机构）
];

/** 是否在权威白名单内。 */
export function isAuthoritative(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return AUTHORITY_WHITELIST_SUFFIXES.some((s) => host === s || host.endsWith(s));
  } catch {
    return false;
  }
}

/** 搜索关键词构造：省份 + AI 应用案例 + 年份。 */
export function buildSearchQueries(province: ProvinceConfig, years: number[]): string[] {
  const baseTerms = [
    "人工智能应用案例",
    "AI典型应用案例",
    "大模型应用案例",
    "人工智能典型案例",
    "数字化智能化应用",
  ];
  const queries: string[] = [];
  for (const year of years) {
    for (const term of baseTerms) {
      queries.push(`${province.shortName}${term}${year}`);
    }
  }
  return queries;
}

/** 默认采集年份窗口。 */
export const TARGET_YEARS = [2026, 2025];

/** 每个搜索引擎结果页最多接受的候选 URL 数（控制抓取量）。 */
export const MAX_CANDIDATES_PER_QUERY = 8;

/** 每日任务全局上限，防止超量抓取/超 API 配额。 */
export const DAILY_CAP = Number(process.env.GOV_DAILY_CAP || 60);
