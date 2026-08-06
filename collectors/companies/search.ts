/**
 * 企业搜索引擎封装：根据 query 返回候选详情页 URL，限定为企业官网域名。
 * 复用 Bing 网页结果解析；若配置 GOV_SEARCH_API_URL 则走 API。
 */

import { fetchHtml } from "../lib/fetch";

export interface SearchHit {
  url: string;
  title: string;
}

function matchesDomain(url: string, domain: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === domain || host.endsWith("." + domain);
  } catch {
    return false;
  }
}

async function searchViaBing(query: string, maxHits: number, domain: string): Promise<SearchHit[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-CN&cc=CN`;
  const res = await fetchHtml(url, { timeoutMs: 25000 });
  return parseBingResults(res.html, maxHits, domain);
}

function parseBingResults(html: string, maxHits: number, domain: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  const linkRe = /<a[^>]+href="(https?:\/\/[^"]+)"/gi;
  const titleRe = /<h2>(.*?)<\/h2>/is;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && hits.length < maxHits * 3) {
    const rawUrl = m[1];
    if (!matchesDomain(rawUrl, domain)) continue;
    if (seen.has(rawUrl)) continue;
    seen.add(rawUrl);
    const tail = html.slice(m.index, m.index + 400);
    const tm = titleRe.exec(tail);
    const title = tm ? tm[1].replace(/<[^>]+>/g, " ").trim() : rawUrl;
    hits.push({ url: rawUrl, title });
    if (hits.length >= maxHits) break;
  }
  return hits;
}

async function searchViaApi(query: string, maxHits: number, domain: string): Promise<SearchHit[]> {
  const apiUrl = process.env.GOV_SEARCH_API_URL!;
  const key = process.env.GOV_SEARCH_API_KEY;
  const sep = apiUrl.includes("?") ? "&" : "?";
  const full = `${apiUrl}${sep}q=${encodeURIComponent(query)}&limit=${maxHits}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(full, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`search api HTTP ${res.status}`);
    const data = (await res.json()) as any;
    const arr = Array.isArray(data) ? data : data.results || data.items || [];
    return (arr as any[])
      .map((d) => ({ url: String(d.url || d.link || ""), title: String(d.title || d.name || d.url || "") }))
      .filter((h) => h.url && matchesDomain(h.url, domain))
      .slice(0, maxHits);
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCases(query: string, maxHits: number, domain: string): Promise<SearchHit[]> {
  if (process.env.GOV_SEARCH_API_URL) {
    try {
      return await searchViaApi(query, maxHits, domain);
    } catch (err: any) {
      console.warn(`[search] API 失败，回退 Bing: ${err.message || err}`);
    }
  }
  try {
    return await searchViaBing(query, maxHits, domain);
  } catch (err: any) {
    console.warn(`[search] Bing 搜索失败 "${query}": ${err.message || err}`);
    return [];
  }
}
