/**
 * 搜索引擎封装：根据 query 返回候选详情页 URL。
 *
 * 策略：
 * - 优先使用环境变量 GOV_SEARCH_ENGINE 配置的搜索引擎首页（默认 Bing）。
 * - 解析 HTML 结果中的 <a> 链接，过滤出命中权威白名单（.gov.cn / 官方媒体）的 URL。
 * - 若配置了 GOV_SEARCH_API_URL（自建/第三方搜索 API，返回 JSON [{url,title}]），则优先走 API。
 *
 * 不依赖付费搜索 API，默认用 Bing 网页结果；如遇反爬，可配置 GOV_SEARCH_API_URL 绕过。
 */

import { fetchHtml } from "../lib/fetch";
import { isAuthoritative } from "./config";

export interface SearchHit {
  url: string;
  title: string;
}

/** 用 Bing 网页搜索，解析结果链接。 */
async function searchViaBing(query: string, maxHits: number): Promise<SearchHit[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-CN&cc=CN`;
  const res = await fetchHtml(url, { timeoutMs: 25000 });
  return parseBingResults(res.html, maxHits);
}

function parseBingResults(html: string, maxHits: number): SearchHit[] {
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  // Bing 结果链接通常形如 <a href="https://..." ...><h2>标题</h2>
  const linkRe = /<a[^>]+href="(https?:\/\/[^"]+)"/gi;
  const titleRe = /<h2>(.*?)<\/h2>/is;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && hits.length < maxHits * 3) {
    const rawUrl = m[1];
    if (!isAuthoritative(rawUrl)) continue;
    if (seen.has(rawUrl)) continue;
    seen.add(rawUrl);
    // 取该 <a> 附近标题
    const tail = html.slice(m.index, m.index + 400);
    const tm = titleRe.exec(tail);
    const title = tm ? tm[1].replace(/<[^>]+>/g, " ").trim() : rawUrl;
    hits.push({ url: rawUrl, title });
    if (hits.length >= maxHits) break;
  }
  return hits;
}

/** 走自建/第三方搜索 API（返回 JSON：[{url,title}]）。 */
async function searchViaApi(query: string, maxHits: number): Promise<SearchHit[]> {
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
      .filter((h) => h.url && isAuthoritative(h.url))
      .slice(0, maxHits);
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCases(query: string, maxHits: number): Promise<SearchHit[]> {
  if (process.env.GOV_SEARCH_API_URL) {
    try {
      return await searchViaApi(query, maxHits);
    } catch (err: any) {
      console.warn(`[search] API 失败，回退 Bing: ${err.message || err}`);
    }
  }
  try {
    return await searchViaBing(query, maxHits);
  } catch (err: any) {
    console.warn(`[search] Bing 搜索失败 "${query}": ${err.message || err}`);
    return [];
  }
}
