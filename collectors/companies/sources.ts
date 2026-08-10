/**
 * 企业（上市公司）"官网固定入口"映射表（人工/半人工沉淀的采集资产）。
 *
 * 设计：
 * - 每个企业对应官网主域名与若干"宣传/吹牛/典型案例"固定入口（columns）。
 * - 抓取时直接从这些入口进，不再依赖泛搜；入口失效由健康检查标记。
 * - `verified: true` 表示已实测可达（容器内 --network host + fetchHtml 能抓到详情）；
 *   `verified: false` 表示工具猜测，待人工/实测确认。
 *
 * 维护方式：
 * 1) 先用 `tsx collectors/lib/scaffold_columns.ts <官网域名>` 扫出候选栏目；
 * 2) 人工从候选里挑出真正的"客户案例/解决方案/标杆应用"入口，填进本表并标记 verified=true。
 * 实测确认命令（容器内 host 出网）：
 *   docker run --rm --network host -v /root/aianliku_20260727103648/.env:/app/.env \\
 *     aianliku-collector:latest npx tsx collectors/companies/run.ts --companies=科大讯飞 --dry-run
 */

import type { EntryType, SourceColumn } from "../government/sources";

export interface CompanySource {
  /** 企业名，与 companies/list.ts 的 KNOWN_COMPANIES.name 对齐 */
  name: string;
  /** 官网主域名，如 "icbc.com.cn" */
  domain: string;
  /** 该官网的"宣传/吹牛/典型案例"固定入口 */
  columns: SourceColumn[];
}

/**
 * 企业官网入口映射。
 * verified=true 的为实测可达入口（见上方维护说明的 dry-run 验证）。
 */
export const COMPANY_SOURCES: CompanySource[] = [
  {
    name: "科大讯飞",
    domain: "iflytek.com",
    columns: [
      // 实测 OK：cases.html 抓到客户案例候选 1 条
      { name: "讯飞-客户案例", url: "https://www.iflytek.com/cases.html", type: "list", detailPattern: "/cases?[\\w/-]*", verified: true },
      // 实测 OK：news.html 可达
      { name: "讯飞-新闻", url: "https://www.iflytek.com/news.html", type: "list", detailPattern: "/news?[\\w/-]*", verified: true },
    ],
  },
  {
    name: "阿里巴巴",
    domain: "alibabagroup.com",
    columns: [
      // 可达但 JS 渲染，需实测 discoverUrls 能否抽详情；先标 false
      { name: "阿里-新闻", url: "https://www.alibabagroup.com/news", type: "list", detailPattern: "/news/[\\w/-]+", verified: false },
      { name: "阿里-新闻(中文)", url: "https://www.alibabagroup.com/zh-cn/news.html", type: "list", detailPattern: "/zh-cn/news[\\w/-]*", verified: false },
    ],
  },
  {
    name: "京东",
    domain: "jd.com",
    columns: [
      { name: "京东-新闻", url: "https://corporate.jd.com/news", type: "list", detailPattern: "/news/[\\w/-]+", verified: false },
    ],
  },
  {
    name: "宁德时代",
    domain: "catl.com",
    columns: [
      { name: "宁德时代-新闻", url: "https://www.catl.com/news/", type: "list", detailPattern: "/news/[\\w/-]+", verified: false },
    ],
  },
  {
    name: "比亚迪",
    domain: "byd.com",
    columns: [
      { name: "比亚迪-新闻", url: "https://www.byd.com/news", type: "list", detailPattern: "/news[\\w/-]*", verified: false },
    ],
  },
  {
    name: "美的集团",
    domain: "midea.com",
    columns: [
      { name: "美的-新闻", url: "https://www.midea.com/news", type: "list", detailPattern: "/news[\\w/-]*", verified: false },
    ],
  },
  {
    name: "海尔智家",
    domain: "haier.com",
    columns: [
      { name: "海尔-新闻", url: "https://www.haier.com/news/", type: "list", detailPattern: "/news/[\\w/-]+", verified: false },
    ],
  },
  {
    name: "三一重工",
    domain: "sany.com",
    columns: [
      { name: "三一-新闻", url: "https://www.sany.com/news", type: "list", detailPattern: "/news[\\w/-]*", verified: false },
    ],
  },
  {
    name: "海康威视",
    domain: "hikvision.com",
    columns: [
      { name: "海康-新闻", url: "https://www.hikvision.com/cn/news/", type: "list", detailPattern: "/cn/news/[\\w/-]+", verified: false },
    ],
  },
  {
    name: "腾讯控股",
    domain: "tencent.com",
    columns: [
      // 404 已修正：正确路径为 /zh-cn/news
      { name: "腾讯-新闻", url: "https://www.tencent.com/zh-cn/news", type: "list", detailPattern: "/zh-cn/news[\\w/-]*", verified: false },
    ],
  },
];

/** 按企业名查映射；不存在返回 undefined。 */
export function getCompanySource(name: string): CompanySource | undefined {
  return COMPANY_SOURCES.find((s) => s.name === name);
}

/** 按域名查映射（用于全量名单里已知域名的公司）。 */
export function getCompanySourceByDomain(domain: string): CompanySource | undefined {
  if (!domain) return undefined;
  const d = domain.replace(/^www\./, "").toLowerCase();
  return COMPANY_SOURCES.find((s) => s.domain.replace(/^www\./, "").toLowerCase() === d);
}
