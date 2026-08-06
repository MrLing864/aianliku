/**
 * 高校候选发现：遍历 985/211 院校，直接抓官网 AI/信息化/新闻栏目发现候选案例，
 * 辅以搜索引擎（限本校域名）发现。结果按"本校域名 + 标题归一化"预去重。
 */

import {
  UNIVERSITIES,
  buildSearchQueries,
  TARGET_YEARS,
  DAILY_CAP,
  MAX_CANDIDATES_PER_QUERY,
  MAX_CANDIDATES_PER_UNI,
  isUniversityDomain,
  UNIV_AI_SECTION_PATHS,
  type UniversityConfig,
} from "./config";
import { searchCases, type SearchHit } from "./search";
import { normalizeTitle } from "../lib/normalize";
import { fetchHtml, mapLimit, canFetch, discoverUrls } from "../lib/fetch";

export interface Candidate {
  url: string;
  title: string;
  university: string;
  domain: string;
  region: string;
  sourceType: "university";
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

/**
 * 直接抓官网内的 AI/新闻栏目列表页，发现候选详情链接。
 * 用宽松正则抓站内链接，再由 enrich 阶段判断是否为 AI 案例。
 */
async function discoverFromSite(uni: UniversityConfig): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const base = `https://${uni.domain}`;
  const sectionUrls = UNIV_AI_SECTION_PATHS.map((p) => base + (p === "/" ? "" : p));
  const htmls = await mapLimit(sectionUrls.slice(0, 4), 2, async (u: string) => {
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
    // 抓站内链接（/article/ /detail/ /show/ 等常见详情路径）
    const urls = discoverUrls(html, "https?://[\\w.-]*" + uni.domain.replace(".", "\\.") + "(?:/[\\w/-]*(?:article|detail|show|info|content|news)[\\w/-]*)?", base);
    for (const url of urls) {
      if (!isUniversityDomain(url, uni.domain)) continue;
      out.push({ url, title: url, university: uni.name, domain: uni.domain, region: uni.region, sourceType: "university" });
    }
  }
  return out;
}

export async function discoverCandidates(opts: { unis?: string[]; years?: number[]; cap?: number } = {}): Promise<Candidate[]> {
  const unis = opts.unis ? UNIVERSITIES.filter((u) => opts.unis!.includes(u.name)) : UNIVERSITIES;
  const years = opts.years || TARGET_YEARS;
  const cap = opts.cap ?? DAILY_CAP;

  const candidates: Candidate[] = [];
  const seenKeys = new Set<string>();

  for (const uni of unis) {
    if (candidates.length >= cap) break;
    let hits: SearchHit[] = [];
    // 优先站内发现，不足再搜索补充
    try {
      const siteCands = await discoverFromSite(uni);
      hits = siteCands.map((c) => ({ url: c.url, title: c.title }));
    } catch {
      /* ignore */
    }
    if (hits.length < MAX_CANDIDATES_PER_UNI) {
      const queries = buildSearchQueries(uni, years);
      const perQuery = await mapLimit(queries, 2, async (q: string) => {
        const h: SearchHit[] = await searchCases(q, MAX_CANDIDATES_PER_QUERY, uni.domain);
        return h;
      });
      for (const h of perQuery) hits.push(...h);
    }

    let added = 0;
    for (const hit of hits) {
      if (added >= MAX_CANDIDATES_PER_UNI) break;
      if (candidates.length >= cap) break;
      if (!isUniversityDomain(hit.url, uni.domain)) continue;
      const cand: Candidate = {
        url: hit.url,
        title: hit.title,
        university: uni.name,
        domain: uni.domain,
        region: uni.region,
        sourceType: "university",
      };
      const key = candidateDedupKey(cand);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      candidates.push(cand);
      added++;
    }
    console.log(`[univ-discover] ${uni.name}: +${added} 候选（累计 ${candidates.length}）`);
  }

  console.log(`[univ-discover] 共发现候选案例 ${candidates.length}`);
  return candidates;
}
