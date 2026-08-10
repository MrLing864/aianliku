/**
 * 企业（上市公司）案例发现：固定入口优先，泛搜兜底。
 *
 * 新逻辑：
 * 1) 读 companies/sources.ts，按企业名/域名取"官网固定入口"；
 * 2) 直接请求每个入口：list 用 discoverUrls 抽详情，detail 直接作候选；
 * 3) 入口失效记入 health，供人工维护 sources.ts；
 * 4) sources 无入口或全失败时，回退 searchCases 泛搜（带 site: 限定官网，避免泛软文）。
 *
 * 对外仍暴露 discoverCandidates（保持 run.ts 兼容）。
 */

import { fetchHtml, discoverUrls, canFetch, sleep, renderHtml } from "../lib/fetch";
import { searchCases } from "./search";
import { buildSearchQueries, MAX_CANDIDATES_PER_QUERY, MAX_CANDIDATES_PER_COMPANY, DAILY_COMPANY_LIMIT } from "./config";
import { getCompanySource, getCompanySourceByDomain } from "./sources";
import { getAllListedCompanies, makeCompanyConfig } from "./list";
import { readCursor, writeCursor } from "./progress";
import type { CompanyCandidate, CompanyConfig } from "./types";
import type { SourceColumn } from "../government/sources";

const DETAIL_PATTERNS = [/news/i, /case/i, /article/i, /content/i, /info/i, /show/i, /view/i, /detail/i, /story/i, /customer/i];

function looksLikeDetail(url: string): boolean {
  const path = url.split("?")[0];
  return DETAIL_PATTERNS.some((p) => p.test(path)) && !/\/(list|index|more|column|center)\b/i.test(path);
}

async function collectFromColumn(col: SourceColumn): Promise<{ candidates: string[]; ok: boolean }> {
  if (!(await canFetch(col.url))) return { candidates: [], ok: false };
  let html = "";
  try {
    const r = await fetchHtml(col.url, { timeoutMs: 20000 });
    html = r.html || "";
  } catch {
    return { candidates: [], ok: false };
  }
  if (!html) return { candidates: [], ok: false };

  if (col.type === "detail") return { candidates: [col.url], ok: true };

  const pattern = col.detailPattern || "[\\w/-]+\\.(html?|shtml)";
  let urls = discoverUrls(html, pattern, col.url);
  const realCount = urls.filter((u) => !/^#|javascript:|mailto:/i.test(u.split("?")[0])).length;

  // SPA 兜底：静态抽不到真实详情链接时，用 Playwright 渲染再抽一次
  if (realCount === 0 && col.type !== "detail") {
    console.log(`[collect:${col.name}] ${col.url} 静态抽取为空，尝试 Playwright 渲染兜底`);
    const rendered = await renderHtml(col.url, { timeoutMs: 20_000 });
    if (rendered) {
      const r2 = discoverUrls(rendered, pattern, col.url).filter((u) => !/^#|javascript:|mailto:/i.test(u.split("?")[0]));
      if (r2.length) {
        urls = r2;
        console.log(`[collect:${col.name}] 渲染兜底命中 ${r2.length} 条真实链接`);
      } else {
        console.log(`[collect:${col.name}] 渲染兜底仍无有效链接`);
      }
    }
  }

  const details = urls.filter(looksLikeDetail);
  return { candidates: details.length ? details : urls, ok: true };
}

export interface DiscoverHealth {
  company: string;
  column: string;
  url: string;
  ok: boolean;
}

export interface DiscoverOptions {
  companyConfigs?: CompanyConfig[];
  companies?: string[];
  explicitCompanies?: boolean;
  cap?: number;
  dailyCompanyLimit?: number;
}

export async function discoverCandidates(opts: DiscoverOptions): Promise<CompanyCandidate[]> {
  const companies = opts.companies && opts.companies.length ? opts.companies : await resolveDailyCompanies();
  const configs = opts.companyConfigs && opts.companyConfigs.length ? opts.companyConfigs : companies.map((n) => makeCompanyConfig(n));

  const health: DiscoverHealth[] = [];
  const all: CompanyCandidate[] = [];

  for (let i = 0; i < companies.length; i++) {
    const name = companies[i];
    const cfg = configs[i];
    const website = cfg?.website || "";
    const src = getCompanySource(name) || (website ? getCompanySourceByDomain(website) : undefined);

    const seen = new Set<string>();
    const out: CompanyCandidate[] = [];

    if (src && src.columns.length) {
      for (const col of src.columns) {
        const { candidates, ok } = await collectFromColumn(col);
        health.push({ company: name, column: col.name, url: col.url, ok });
        for (const url of candidates) {
          if (seen.has(url)) continue;
          seen.add(url);
          out.push({ url, sourceName: `${name}·${col.name}`, candidates: [], weight: 0 });
          if (out.length >= MAX_CANDIDATES_PER_COMPANY) break;
        }
        await sleep(300);
        if (out.length >= MAX_CANDIDATES_PER_COMPANY) break;
      }
    }

    // 兜底：sources 无入口或入口全失败 → 泛搜（带 site: 限定官网）
    const allFailed = src && src.columns.length > 0 && health.filter((h) => h.company === name).every((h) => !h.ok);
    if ((!src || !src.columns.length || allFailed) && out.length < MAX_CANDIDATES_PER_COMPANY) {
      const domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      const queries = buildSearchQueries(name, domain);
      for (const q of queries) {
        const urls = await searchCases(q, MAX_CANDIDATES_PER_QUERY, domain);
        for (const url of urls) {
          if (seen.has(url)) continue;
          seen.add(url);
          out.push({ url, sourceName: `${name}·搜索兜底`, candidates: [], weight: 0 });
          if (out.length >= MAX_CANDIDATES_PER_COMPANY) break;
        }
        await sleep(500);
        if (out.length >= MAX_CANDIDATES_PER_COMPANY) break;
      }
    }

    all.push(...out);
    const fromFixed = out.filter((c) => !c.sourceName.endsWith("·搜索兜底")).length;
    const fromFallback = out.length - fromFixed;
    console.log(`[discover:${name}] 候选=${out.length} 固定入口=${fromFixed} 兜底=${fromFallback}`);
    for (const h of health.filter((x) => x.company === name)) console.log(`  [health] ${h.ok ? "OK " : "FAIL"} ${h.column} ${h.url}`);
    if (opts.cap && all.length >= opts.cap) break;
  }

  // 入口健康落盘
  try {
    const { writeFileSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    const p = "/var/log/company-discover-health.json";
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify({ at: new Date().toISOString(), health }, null, 2));
  } catch {
    /* 忽略 */
  }

  return opts.cap ? all.slice(0, opts.cap) : all;
}

async function resolveDailyCompanies(): Promise<string[]> {
  const all = await getAllListedCompanies();
  if (all.length === 0) return [];
  const cursor = await readCursor();
  const total = all.length;
  const start = cursor.index % total;
  const end = Math.min(start + (DAILY_COMPANY_LIMIT || 100), start + total);
  const names: string[] = [];
  for (let i = start; i < end; i++) names.push(all[i % total].name);
  const newIndex = (start + (DAILY_COMPANY_LIMIT || 100)) % total;
  await writeCursor({ index: newIndex, round: cursor.round, lastCompany: names[names.length - 1] });
  return names;
}

export function candidateDedupKey(c: CompanyCandidate): string {
  return c.url;
}
