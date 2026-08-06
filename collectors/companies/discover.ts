/**
 * 企业候选发现：
 *  - 内置清单（含官网）：直接抓官网 AI/新闻/案例栏目发现候选，辅以搜索（限官网）。
 *  - 全量 A 股（无官网）：用搜索引擎发现企业官网内的 AI 案例页（结果按企业官网域名过滤）。
 */

import {
  TARGET_YEARS,
  DAILY_CAP,
  DAILY_COMPANY_LIMIT,
  MAX_CANDIDATES_PER_QUERY,
  MAX_CANDIDATES_PER_COMPANY,
  COMPANY_AI_SECTION_PATHS,
  buildSearchQueries,
} from "./config";
import { getKnownCompanies, getAllAStockNames, getKnownCompanyByName, type CompanyConfig } from "./list";
import { searchCases, type SearchHit } from "./search";
import { normalizeTitle } from "../lib/normalize";
import { fetchHtml, mapLimit, canFetch, discoverUrls } from "../lib/fetch";

export interface Candidate {
  url: string;
  title: string;
  company: string;
  domain: string;
  scale: string;
  sourceType: "company";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function candidateDedupKey(c: Candidate): string {
  return `${normalizeTitle(c.title)}__${hostOf(c.url)}__`;
}

function isCompanyDomain(url: string, domain: string): boolean {
  if (!domain) return true; // 无官网时不过滤
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === domain || host.endsWith("." + domain);
  } catch {
    return false;
  }
}

async function discoverFromSite(company: CompanyConfig): Promise<string[]> {
  const out: string[] = [];
  const base = `https://${company.domain}`;
  const sectionUrls = COMPANY_AI_SECTION_PATHS.map((p) => base + (p === "/" ? "" : p));
  const htmls = await mapLimit(sectionUrls.slice(0, 5), 2, async (u: string) => {
    if (!(await canFetch(u))) return "";
    try {
      const r = await fetchHtml(u, { timeoutMs: 15000 });
      return r.html;
    } catch {
      return "";
    }
  });
  for (const html of htmls) {
    if (!html) continue;
    const urls = discoverUrls(
      html,
      "https?://[\\w.-]*" + company.domain.replace(".", "\\.") + "(?:/[\\w/-]*(?:case|cases|news|article|detail|show|solution|solutions|info|content)[\\w/-]*)?",
      base,
    );
    out.push(...urls);
  }
  return out;
}

export interface DiscoverOptions {
  /** 今日要采集的企业名列表（今日循环模式）。指定后只处理这些企业，按企业计数停止，并跳过全量搜索阶段。 */
  companies?: string[];
  /** 今日模式下的企业配置列表（含官网域名等），优先于 companies 名称过滤 KNOWN。 */
  companyConfigs?: CompanyConfig[];
  /** 是否"今日显式名单模式"：true 表示 companies/companyConfigs 为今日切片（按企业计数循环）；false 为手动/全量模式。 */
  explicitCompanies?: boolean;
  years?: number[];
  /** 候选总数安全上限（默认 DAILY_CAP）。 */
  cap?: number;
  /** 每日企业上限（默认 DAILY_COMPANY_LIMIT）。达到后停止遍历新企业。 */
  dailyCompanyLimit?: number;
}

export async function discoverCandidates(opts: DiscoverOptions = {}): Promise<Candidate[]> {
  const years = opts.years || TARGET_YEARS;
  const cap = opts.cap ?? DAILY_CAP;
  const dailyCompanyLimit = opts.dailyCompanyLimit ?? DAILY_COMPANY_LIMIT;
  const isTodayMode = !!opts.explicitCompanies && (!!opts.companies?.length || !!opts.companyConfigs?.length);

  const candidates: Candidate[] = [];
  const seenKeys = new Set<string>();
  let processedCompanies = 0;

  // 1) 内置清单（去官网采集）
  const known: CompanyConfig[] =
    isTodayMode
      ? opts.companyConfigs && opts.companyConfigs.length
        ? opts.companyConfigs
        : getKnownCompanies().filter((c) => opts.companies!.includes(c.name))
      : getKnownCompanies();
  for (const company of known) {
    if (candidates.length >= cap) break;
    if (processedCompanies >= dailyCompanyLimit) break; // 每日企业数上限
    let hits: SearchHit[] = [];
    try {
      const siteUrls = await discoverFromSite(company);
      hits = siteUrls.map((u) => ({ url: u, title: u }));
    } catch {
      /* ignore */
    }
    if (hits.length < MAX_CANDIDATES_PER_COMPANY && company.domain) {
      const queries = buildSearchQueries(company.name, years);
      const perQuery = await mapLimit(queries, 2, async (q: string) => searchCases(q, MAX_CANDIDATES_PER_QUERY, company.domain));
      for (const h of perQuery) hits.push(...h);
    }
    let added = 0;
    for (const hit of hits) {
      if (added >= MAX_CANDIDATES_PER_COMPANY) break;
      if (candidates.length >= cap) break;
      if (!isCompanyDomain(hit.url, company.domain)) continue;
      const cand: Candidate = { url: hit.url, title: hit.title, company: company.name, domain: company.domain, scale: company.scale, sourceType: "company" };
      const key = candidateDedupKey(cand);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      candidates.push(cand);
      added++;
    }
    processedCompanies++;
    console.log(`[company-discover] ${company.name}: +${added} 候选（累计 ${candidates.length}，企业 ${processedCompanies}/${dailyCompanyLimit}）`);
  }

  // 2) 全量 A 股 / 港股（搜索发现，覆盖"全部上市公司"）
  //    今日显式名单模式下跳过：companies 已是今日切片，且企业计数已达上限即停。
  if (!isTodayMode && candidates.length < cap) {
    const allNames = await getAllAStockNames();
    const rest = opts.companies ? allNames.filter((n) => opts.companies!.includes(n)) : allNames;
    for (const name of rest) {
      if (candidates.length >= cap) break;
      if (processedCompanies >= dailyCompanyLimit) break;
      const queries = buildSearchQueries(name, years);
      const perQuery = await mapLimit(queries.slice(0, 3), 2, async (q: string) => searchCases(q, 2, ""));
      let added = 0;
      for (const h of perQuery.flat()) {
        if (added >= 1) break;
        if (candidates.length >= cap) break;
        const cand: Candidate = { url: h.url, title: h.title, company: name, domain: "", scale: "未披露", sourceType: "company" };
        const key = candidateDedupKey(cand);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        candidates.push(cand);
        added++;
      }
      processedCompanies++;
      if (added) console.log(`[company-discover] ${name}: +${added}（累计 ${candidates.length}，企业 ${processedCompanies}/${dailyCompanyLimit}）`);
    }
  }

  console.log(`[company-discover] 共发现候选案例 ${candidates.length}（处理企业 ${processedCompanies} 家）`);
  return candidates;
}
