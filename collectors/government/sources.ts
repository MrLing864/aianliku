/**
 * 政府机关"官网固定入口"映射表（人工/半人工沉淀的采集资产）。
 *
 * 设计：
 * - 每个省份/计划单列市对应一个官方站点与若干"宣传/吹牛/典型案例"固定入口（columns）。
 * - 抓取时直接从这些入口进，不再依赖泛搜；入口失效由健康检查标记。
 * - `verified: true` 表示已实测可达（容器内 --network host + fetchHtml 能抓到详情）；
 *   `verified: false` 表示工具猜测，待人工/实测确认。
 *
 * 维护方式：
 * 1) 先用 `tsx collectors/lib/scaffold_columns.ts <官网域名>` 扫出候选栏目；
 * 2) 人工从候选里挑出真正的"案例/新闻/标杆"入口，填进本表并标记 verified=true。
 * 实测确认命令（容器内 host 出网）：
 *   docker run --rm --network host -v /root/aianliku_20260727103648/.env:/app/.env \\
 *     aianliku-collector:latest npx tsx collectors/government/run.ts --provinces=广东 --dry-run
 */

export type EntryType = "list" | "detail";

export interface SourceColumn {
  /** 栏目中文名，如 "典型案例" "智能问答" "数字政府" */
  name: string;
  /** 入口完整 URL */
  url: string;
  /**
   * list  = 列表页，需进一步 discoverUrls 抽出详情链接；
   * detail = 已是详情页，直接抽取。
   */
  type: EntryType;
  /** 该入口下的详情链接路径正则（仅 list 类型需要），用于 discoverUrls 抽取。 */
  detailPattern?: string;
  /** 是否已实测/人工确认（false=工具猜测，待确认） */
  verified: boolean;
}

export interface GovSource {
  /** 省份/城市名，与 config.ts 的 PROVINCES.name 对齐（支持「广东」匹配「广东省」） */
  province: string;
  /** 官方站点主域名，如 "gd.gov.cn" */
  domain: string;
  /** 该官网的"宣传/吹牛/典型案例"固定入口 */
  columns: SourceColumn[];
}

/**
 * 政府机关官网入口映射。
 * verified=true 的为实测可达入口（见上方维护说明的 dry-run 验证）。
 */
export const GOV_SOURCES: GovSource[] = [
  {
    province: "广东省",
    domain: "gd.gov.cn",
    columns: [
      // 实测 OK：抓到 28 条 zwgk 真实栏目详情（政务公开含数字政府/政策落地）
      { name: "广东省政府-政务公开", url: "https://www.gd.gov.cn/zwgk/", type: "list", detailPattern: "/zwgk/[\\w/-]+", verified: true },
      // 待验证：广东要闻（可能含 AI/数字政府报道）
      { name: "广东省政府-广东要闻", url: "https://www.gd.gov.cn/gdyw/", type: "list", detailPattern: "/gdyw/[\\w/-]+", verified: false },
    ],
  },
  {
    province: "吉林省",
    domain: "jl.gov.cn",
    columns: [
      // 扫描发现的真实 AI 栏目域名（待验证可达）
      { name: "吉林省-人工智能专栏", url: "http://ai.jl.gov.cn/", type: "list", detailPattern: "/[\\w/-]+", verified: false },
      // 待验证：吉林省政府站正确域名下的政务公开
      { name: "吉林省-政务公开", url: "https://www.jl.gov.cn/zwgk/", type: "list", detailPattern: "/zwgk/[\\w/-]+", verified: false },
    ],
  },
  {
    province: "北京市",
    domain: "beijing.gov.cn",
    columns: [
      { name: "首都之窗-新闻", url: "https://www.beijing.gov.cn/news/", type: "list", detailPattern: "/news/[\\w/-]+", verified: false },
    ],
  },
  {
    province: "上海市",
    domain: "shanghai.gov.cn",
    columns: [
      { name: "中国上海-新闻", url: "https://www.shanghai.gov.cn/nw12344/index.html", type: "list", detailPattern: "/nw\\d+/index.html", verified: false },
    ],
  },
  {
    province: "浙江省",
    domain: "zj.gov.cn",
    columns: [
      { name: "浙江省政府-新闻", url: "https://www.zj.gov.cn/col/col1229019371/index.html", type: "list", detailPattern: "/col/col\\d+/index.html", verified: false },
    ],
  },
  {
    province: "江苏省",
    domain: "jiangsu.gov.cn",
    columns: [
      { name: "江苏省政府-新闻", url: "https://www.jiangsu.gov.cn/col/col76349/index.html", type: "list", detailPattern: "/col/col\\d+/index.html", verified: false },
    ],
  },
  {
    province: "深圳市",
    domain: "sz.gov.cn",
    columns: [
      { name: "深圳政府在线-政务动态", url: "https://www.sz.gov.cn/cn/xxgk/zfxxgj/", type: "list", detailPattern: "/cn/xxgk/zfxxgj/[\\w/-]+", verified: false },
    ],
  },
  {
    province: "杭州市",
    domain: "hangzhou.gov.cn",
    columns: [
      { name: "杭州市政府-新闻", url: "https://www.hangzhou.gov.cn/col/col1228972512/index.html", type: "list", detailPattern: "/col/col\\d+/index.html", verified: false },
    ],
  },
];

/** 省份名归一化：去掉「省/市/自治区/特别行政区」等后缀，便于短名匹配。 */
function normalizeProvince(p: string): string {
  return p.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔|族)/g, "").trim();
}

/** 按 province 名查映射（支持「广东」匹配「广东省」）；不存在返回 undefined。 */
export function getGovSource(province: string): GovSource | undefined {
  const target = normalizeProvince(province);
  return GOV_SOURCES.find((s) => normalizeProvince(s.province) === target);
}
