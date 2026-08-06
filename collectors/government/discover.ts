/**
 * 发现阶段：遍历各省份，按年份/关键词搜索，产出候选案例 URL 列表。
 * 结果按权威白名单过滤，并按 dedupKey 预去重（标题归一化 + 域名）。
 */

import { PROVINCES, buildSearchQueries, TARGET_YEARS, MAX_CANDIDATES_PER_QUERY, DAILY_CAP, isAuthoritative } from "./config";
import { searchCases, type SearchHit } from "./search";
import { normalizeTitle } from "../lib/normalize";
import { mapLimit } from "../lib/fetch";

export interface Candidate {
  url: string;
  title: string;
  province: string;
  sourceType: "government";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 生成候选的临时 dedupKey（在抓取详情后会被重新计算为正式值）。 */
export function candidateDedupKey(c: Candidate): string {
  return `${normalizeTitle(c.title)}__${hostOf(c.url)}__`;
}

export async function discoverCandidates(opts: { provinces?: string[]; years?: number[]; cap?: number } = {}): Promise<Candidate[]> {
  const provinces = opts.provinces ? PROVINCES.filter((p) => opts.provinces!.includes(p.name)) : PROVINCES;
  const years = opts.years || TARGET_YEARS;
  const cap = opts.cap ?? DAILY_CAP;

  const candidates: Candidate[] = [];
  const seenKeys = new Set<string>();

  for (const province of provinces) {
    if (candidates.length >= cap) break;
    const queries = buildSearchQueries(province, years);
    // 并发执行该省的所有搜索 query
    const hitsPerQuery = await mapLimit(queries, 3, async (q: string) => {
      const hits: SearchHit[] = await searchCases(q, MAX_CANDIDATES_PER_QUERY);
      return hits;
    });
    for (const hits of hitsPerQuery) {
      for (const hit of hits) {
        if (candidates.length >= cap) break;
        if (!isAuthoritative(hit.url)) continue;
        const cand: Candidate = {
          url: hit.url,
          title: hit.title,
          province: province.name,
          sourceType: "government",
        };
        const key = candidateDedupKey(cand);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        candidates.push(cand);
      }
    }
    console.log(`[discover] ${province.name}: 累计候选 ${candidates.length}`);
  }

  console.log(`[discover] 共发现候选案例 ${candidates.length}`);
  return candidates;
}
