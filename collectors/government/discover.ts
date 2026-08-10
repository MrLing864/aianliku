/**
 * 政府机关案例发现：固定入口优先，泛搜兜底。
 *
 * 新逻辑：
 * 1) 读 government/sources.ts 的 GOV_SOURCES，按省份取"官网固定入口"；
 * 2) 直接请求每个入口：list 类型用 discoverUrls 抽详情，detail 直接作候选；
 * 3) 入口失效（404/空）记入 health，供人工更新 sources.ts；
 * 4) 某省份在 sources.ts 无入口或入口全失败时，回退原 searchCases 泛搜兜底。
 *
 * 对外仍暴露 discoverCandidates（保持 run.ts 兼容），并通过 discoverHealth 返回入口健康。
 */

import { fetchHtml, discoverUrls, canFetch, sleep, renderHtml } from "../lib/fetch";
import { searchCases } from "./search";
import { buildSearchQueries, MAX_CANDIDATES_PER_QUERY, PROVINCES } from "./config";
import { getGovSource } from "./sources";
import type { GovCandidate } from "./types";
import type { SourceColumn } from "./sources";

const DETAIL_PATTERNS = [/news/i, /case/i, /article/i, /content/i, /info/i, /show/i, /view/i, /detail/i];

function looksLikeDetail(url: string): boolean {
  const path = url.split("?")[0];
  return DETAIL_PATTERNS.some((p) => p.test(path)) && !/\/(list|index|more|column)\b/i.test(path);
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
  province: string;
  column: string;
  url: string;
  ok: boolean;
}

export interface DiscoverResult {
  candidates: GovCandidate[];
  health: DiscoverHealth[];
}

async function discoverForProvince(province: string, domain: string, queries: string[]): Promise<DiscoverResult> {
  const src = getGovSource(province);
  const health: DiscoverHealth[] = [];
  const seen = new Set<string>();
  const out: GovCandidate[] = [];

  if (src && src.columns.length) {
    for (const col of src.columns) {
      const { candidates, ok } = await collectFromColumn(col);
      health.push({ province, column: col.name, url: col.url, ok });
      for (const url of candidates) {
        if (seen.has(url)) continue;
        seen.add(url);
        out.push({ url, sourceName: `${province}·${col.name}`, candidates: [], weight: 0 });
      }
      await sleep(300);
    }
  }

  // 兜底：sources 无入口或入口全失败时，回退泛搜
  const allFailed = src && src.columns.length > 0 && health.every((h) => !h.ok);
  if (!src || !src.columns.length || allFailed) {
    for (const q of queries) {
      const urls = await searchCases(q, MAX_CANDIDATES_PER_QUERY, domain);
      for (const url of urls) {
        if (seen.has(url)) continue;
        seen.add(url);
        out.push({ url, sourceName: `${province}·搜索兜底`, candidates: [], weight: 0 });
      }
      await sleep(500);
    }
  }

  return { candidates: out, health };
}

export async function discoverCandidates(opts: { provinces?: string[]; cap?: number }): Promise<GovCandidate[]> {
  const provinces = (opts.provinces && opts.provinces.length ? opts.provinces : PROVINCES.map((p) => p.name));
  const allHealth: DiscoverHealth[] = [];
  const all: GovCandidate[] = [];

  for (const province of provinces) {
    const cfg = PROVINCES.find((p) => p.name === province);
    const domain = cfg?.govDomain || "";
    const queries = buildSearchQueries(province, domain);
    const { candidates, health } = await discoverForProvince(province, domain, queries);
    all.push(...candidates);
    allHealth.push(...health);
    const fromFixed = candidates.filter((c) => !c.sourceName.endsWith("·搜索兜底")).length;
    const fromFallback = candidates.length - fromFixed;
    console.log(`[discover:${province}] 候选=${candidates.length} 固定入口=${fromFixed} 兜底=${fromFallback}`);
    for (const h of health) console.log(`  [health] ${h.ok ? "OK " : "FAIL"} ${h.column} ${h.url}`);
    if (opts.cap && all.length >= opts.cap) break;
  }

  // 入口健康落盘（供人工维护 sources.ts）
  try {
    const { writeFileSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    const p = "/var/log/gov-discover-health.json";
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify({ at: new Date().toISOString(), health: allHealth }, null, 2));
  } catch {
    /* 忽略 */
  }

  return opts.cap ? all.slice(0, opts.cap) : all;
}

export function candidateDedupKey(c: GovCandidate): string {
  return c.url;
}
