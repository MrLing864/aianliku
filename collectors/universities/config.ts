/**
 * 高校 AI 应用案例采集配置
 *
 * 采集范围：国内 985 / 211 院校（约 140 所）。
 * 采集方式：直接去院校官网（"去官网"），优先抓 AI/信息化/新闻栏目发现候选案例，
 *          辅以搜索引擎发现官网内 AI 案例页（仍限定为本校域名）。
 */

export interface UniversityConfig {
  /** 学校全称，如 "清华大学" */
  name: string;
  /** 官网主域名，如 "tsinghua.edu.cn" */
  domain: string;
  /** 标签：985 / 211（985 同时也标 211） */
  tags: ("985" | "211")[];
  /** 所在城市/省份，用于 region 字段 */
  region: string;
}

/**
 * 985 工程（39 所，全部同时属于 211）。
 * 域名采用各校官方主站（edu.cn 体系）。
 */
const C9_985: UniversityConfig[] = [
  { name: "清华大学", domain: "tsinghua.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "北京大学", domain: "pku.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "复旦大学", domain: "fudan.edu.cn", tags: ["985", "211"], region: "上海市" },
  { name: "上海交通大学", domain: "sjtu.edu.cn", tags: ["985", "211"], region: "上海市" },
  { name: "浙江大学", domain: "zju.edu.cn", tags: ["985", "211"], region: "浙江省杭州市" },
  { name: "南京大学", domain: "nju.edu.cn", tags: ["985", "211"], region: "江苏省南京市" },
  { name: "中国科学技术大学", domain: "ustc.edu.cn", tags: ["985", "211"], region: "安徽省合肥市" },
  { name: "哈尔滨工业大学", domain: "hit.edu.cn", tags: ["985", "211"], region: "黑龙江省哈尔滨市" },
  { name: "西安交通大学", domain: "xjtu.edu.cn", tags: ["985", "211"], region: "陕西省西安市" },
];

const OTHER_985: UniversityConfig[] = [
  { name: "中国人民大学", domain: "ruc.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "北京航空航天大学", domain: "buaa.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "北京理工大学", domain: "bit.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "中国农业大学", domain: "cau.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "北京师范大学", domain: "bnu.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "中央民族大学", domain: "muc.edu.cn", tags: ["985", "211"], region: "北京市" },
  { name: "南开大学", domain: "nankai.edu.cn", tags: ["985", "211"], region: "天津市" },
  { name: "天津大学", domain: "tju.edu.cn", tags: ["985", "211"], region: "天津市" },
  { name: "大连理工大学", domain: "dlut.edu.cn", tags: ["985", "211"], region: "辽宁省大连市" },
  { name: "东北大学", domain: "neu.edu.cn", tags: ["985", "211"], region: "辽宁省沈阳市" },
  { name: "吉林大学", domain: "jlu.edu.cn", tags: ["985", "211"], region: "吉林省长春市" },
  { name: "同济大学", domain: "tongji.edu.cn", tags: ["985", "211"], region: "上海市" },
  { name: "华东师范大学", domain: "ecnu.edu.cn", tags: ["985", "211"], region: "上海市" },
  { name: "东南大学", domain: "seu.edu.cn", tags: ["985", "211"], region: "江苏省南京市" },
  { name: "厦门大学", domain: "xmu.edu.cn", tags: ["985", "211"], region: "福建省厦门市" },
  { name: "山东大学", domain: "sdu.edu.cn", tags: ["985", "211"], region: "山东省济南市" },
  { name: "中国海洋大学", domain: "ouc.edu.cn", tags: ["985", "211"], region: "山东省青岛市" },
  { name: "武汉大学", domain: "whu.edu.cn", tags: ["985", "211"], region: "湖北省武汉市" },
  { name: "华中科技大学", domain: "hust.edu.cn", tags: ["985", "211"], region: "湖北省武汉市" },
  { name: "湖南大学", domain: "hnu.edu.cn", tags: ["985", "211"], region: "湖南省长沙市" },
  { name: "中南大学", domain: "csu.edu.cn", tags: ["985", "211"], region: "湖南省长沙市" },
  { name: "中山大学", domain: "sysu.edu.cn", tags: ["985", "211"], region: "广东省广州市" },
  { name: "华南理工大学", domain: "scut.edu.cn", tags: ["985", "211"], region: "广东省广州市" },
  { name: "四川大学", domain: "scu.edu.cn", tags: ["985", "211"], region: "四川省成都市" },
  { name: "重庆大学", domain: "cqu.edu.cn", tags: ["985", "211"], region: "重庆市" },
  { name: "电子科技大学", domain: "uestc.edu.cn", tags: ["985", "211"], region: "四川省成都市" },
  { name: "西北工业大学", domain: "nwpu.edu.cn", tags: ["985", "211"], region: "陕西省西安市" },
  { name: "兰州大学", domain: "lzu.edu.cn", tags: ["985", "211"], region: "甘肃省兰州市" },
];

/**
 * 211 工程（非 985 部分，约 77 所）。
 * 仅列代表性院校主域名（规模控制），如需全量可在此补充。
 */
const C211_ONLY: UniversityConfig[] = [
  { name: "北京邮电大学", domain: "bupt.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京交通大学", domain: "bjtu.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京科技大学", domain: "ustb.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京化工大学", domain: "buct.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京工业大学", domain: "bjut.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京林业大学", domain: "bjfu.edu.cn", tags: ["211"], region: "北京市" },
  { name: "中国传媒大学", domain: "cuc.edu.cn", tags: ["211"], region: "北京市" },
  { name: "对外经济贸易大学", domain: "uibe.edu.cn", tags: ["211"], region: "北京市" },
  { name: "中央财经大学", domain: "cufe.edu.cn", tags: ["211"], region: "北京市" },
  { name: "北京中医药大学", domain: "bucm.edu.cn", tags: ["211"], region: "北京市" },
  { name: "中国政法大学", domain: "cupl.edu.cn", tags: ["211"], region: "北京市" },
  { name: "华北电力大学", domain: "ncepu.edu.cn", tags: ["211"], region: "北京市" },
  { name: "天津医科大学", domain: "tmu.edu.cn", tags: ["211"], region: "天津市" },
  { name: "河北工业大学", domain: "hebut.edu.cn", tags: ["211"], region: "天津市" },
  { name: "太原理工大学", domain: "tyut.edu.cn", tags: ["211"], region: "山西省太原市" },
  { name: "内蒙古大学", domain: "imu.edu.cn", tags: ["211"], region: "内蒙古自治区呼和浩特市" },
  { name: "辽宁大学", domain: "lnu.edu.cn", tags: ["211"], region: "辽宁省沈阳市" },
  { name: "大连海事大学", domain: "dlmu.edu.cn", tags: ["211"], region: "辽宁省大连市" },
  { name: "延边大学", domain: "ybu.edu.cn", tags: ["211"], region: "吉林省延吉市" },
  { name: "东北师范大学", domain: "nenu.edu.cn", tags: ["211"], region: "吉林省长春市" },
  { name: "东北农业大学", domain: "neau.edu.cn", tags: ["211"], region: "黑龙江省哈尔滨市" },
  { name: "东北林业大学", domain: "nefu.edu.cn", tags: ["211"], region: "黑龙江省哈尔滨市" },
  { name: "苏州大学", domain: "suda.edu.cn", tags: ["211"], region: "江苏省苏州市" },
  { name: "南京航空航天大学", domain: "nuaa.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "南京理工大学", domain: "njust.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "中国矿业大学", domain: "cumt.edu.cn", tags: ["211"], region: "江苏省徐州市" },
  { name: "南京农业大学", domain: "njau.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "南京师范大学", domain: "njnu.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "河海大学", domain: "hhu.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "江南大学", domain: "jiangnan.edu.cn", tags: ["211"], region: "江苏省无锡市" },
  { name: "中国药科大学", domain: "cpu.edu.cn", tags: ["211"], region: "江苏省南京市" },
  { name: "合肥工业大学", domain: "hfut.edu.cn", tags: ["211"], region: "安徽省合肥市" },
  { name: "安徽大学", domain: "ahu.edu.cn", tags: ["211"], region: "安徽省合肥市" },
  { name: "福州大学", domain: "fzu.edu.cn", tags: ["211"], region: "福建省福州市" },
  { name: "南昌大学", domain: "ncu.edu.cn", tags: ["211"], region: "江西省南昌市" },
  { name: "中国石油大学（华东）", domain: "upc.edu.cn", tags: ["211"], region: "山东省青岛市" },
  { name: "郑州大学", domain: "zzu.edu.cn", tags: ["211"], region: "河南省郑州市" },
  { name: "武汉理工大学", domain: "whut.edu.cn", tags: ["211"], region: "湖北省武汉市" },
  { name: "中国地质大学（武汉）", domain: "cug.edu.cn", tags: ["211"], region: "湖北省武汉市" },
  { name: "华中农业大学", domain: "hzau.edu.cn", tags: ["211"], region: "湖北省武汉市" },
  { name: "华中师范大学", domain: "ccnu.edu.cn", tags: ["211"], region: "湖北省武汉市" },
  { name: "中南财经政法大学", domain: "zuel.edu.cn", tags: ["211"], region: "湖北省武汉市" },
  { name: "湖南师范大学", domain: "hunnu.edu.cn", tags: ["211"], region: "湖南省长沙市" },
  { name: "广西大学", domain: "gxu.edu.cn", tags: ["211"], region: "广西壮族自治区南宁市" },
  { name: "海南大学", domain: "hainanu.edu.cn", tags: ["211"], region: "海南省海口市" },
  { name: "西南交通大学", domain: "swjtu.edu.cn", tags: ["211"], region: "四川省成都市" },
  { name: "西南财经大学", domain: "swufe.edu.cn", tags: ["211"], region: "四川省成都市" },
  { name: "四川农业大学", domain: "sicau.edu.cn", tags: ["211"], region: "四川省雅安市" },
  { name: "贵州大学", domain: "gzu.edu.cn", tags: ["211"], region: "贵州省贵阳市" },
  { name: "云南大学", domain: "ynu.edu.cn", tags: ["211"], region: "云南省昆明市" },
  { name: "西藏大学", domain: "utibet.edu.cn", tags: ["211"], region: "西藏自治区拉萨市" },
  { name: "西安电子科技大学", domain: "xidian.edu.cn", tags: ["211"], region: "陕西省西安市" },
  { name: "长安大学", domain: "chd.edu.cn", tags: ["211"], region: "陕西省西安市" },
  { name: "陕西师范大学", domain: "snnu.edu.cn", tags: ["211"], region: "陕西省西安市" },
  { name: "青海大学", domain: "qhu.edu.cn", tags: ["211"], region: "青海省西宁市" },
  { name: "宁夏大学", domain: "nxu.edu.cn", tags: ["211"], region: "宁夏回族自治区银川市" },
  { name: "新疆大学", domain: "xju.edu.cn", tags: ["211"], region: "新疆维吾尔自治区乌鲁木齐市" },
  { name: "石河子大学", domain: "shzu.edu.cn", tags: ["211"], region: "新疆维吾尔自治区石河子市" },
  { name: "华东理工大学", domain: "ecust.edu.cn", tags: ["211"], region: "上海市" },
  { name: "东华大学", domain: "dhu.edu.cn", tags: ["211"], region: "上海市" },
  { name: "上海大学", domain: "shu.edu.cn", tags: ["211"], region: "上海市" },
  { name: "上海财经大学", domain: "shufe.edu.cn", tags: ["211"], region: "上海市" },
  { name: "上海外国语大学", domain: "shisu.edu.cn", tags: ["211"], region: "上海市" },
];

export const UNIVERSITIES: UniversityConfig[] = [...C9_985, ...OTHER_985, ...C211_ONLY];

/** 所有院校的 edu 域名后缀（用于 discover 阶段限定"只采本校官网"）。 */
export function isUniversityDomain(url: string, domain: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === domain || host.endsWith("." + domain);
  } catch {
    return false;
  }
}

/** 院校官网内，可能包含 AI 案例的栏目路径关键词（用于发现候选列表页）。 */
export const UNIV_AI_SECTION_PATHS = [
  "/xxb", // 信息化办
  "/xxh", // 信息化
  "/ai", // 人工智能学院/研究院
  "/news", // 新闻网
  "/xwzx", // 新闻中心
  "/info", // 通知公告/信息化
  "/kxyj", // 科学研究
  "/keyan", // 科研
];

/** 搜索引擎 query：校名 + AI 应用关键词。 */
export function buildSearchQueries(uni: UniversityConfig, years: number[]): string[] {
  const baseTerms = [
    "人工智能应用案例",
    "大模型应用",
    "AI赋能教学科研",
    "智慧校园 人工智能",
    "智能体 校园应用",
  ];
  const queries: string[] = [];
  for (const year of years) {
    for (const term of baseTerms) {
      queries.push(`${uni.name} ${term} ${year}`);
    }
  }
  return queries;
}

/** 默认采集年份窗口。 */
export const TARGET_YEARS = [2026, 2025, 2024];

/** 每日任务全局上限，防止超量抓取/超 API 配额。 */
export const DAILY_CAP = Number(process.env.UNIV_DAILY_CAP || 80);

/** 每校候选上限。 */
export const MAX_CANDIDATES_PER_UNI = Number(process.env.UNIV_PER_UNI || 4);

/** 搜索引擎每 query 候选数。 */
export const MAX_CANDIDATES_PER_QUERY = 6;
