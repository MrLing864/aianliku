/**
 * 通用抓取工具：带 UA、超时、重试、并发限制的 HTML 抓取，并输出去噪后的纯文本。
 * 不依赖 cheerio，避免引入额外依赖；HTML→文本用轻量正则剥离即可满足 LLM 抽取需求。
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;

export interface FetchResult {
  html: string;
  text: string;
  status: number;
  finalUrl: string;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 轻量 robots.txt 合规检查：仅允许抓取未被目标站点 Disallow 的路径。
 * 政府站一般允许抓取，这里做基础保护，避免过度请求被封禁。
 * 出错（如无法获取 robots）时默认允许，保证采集不中断。
 */
const robotsCache = new Map<string, { disallow: string[]; at: number }>();
async function fetchRobotsDisallow(host: string): Promise<string[]> {
  const cached = robotsCache.get(host);
  const now = Date.now();
  if (cached && now - cached.at < 6 * 60 * 60 * 1000) return cached.disallow; // 6h 缓存
  try {
    const res = await fetch(`https://${host}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      robotsCache.set(host, { disallow: [], at: now });
      return [];
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const disallow: string[] = [];
    let active = true;
    for (const raw of lines) {
      const line = raw.trim();
      if (/^user-agent:/i.test(line)) {
        active = /.*\*|.*bot|.*spider|.*crawl/i.test(line.split(":")[1] || "");
        continue;
      }
      if (/^disallow:/i.test(line) && active) {
        const p = (line.split(":").slice(1).join(":") || "").trim();
        if (p && p !== "/") disallow.push(p);
      }
    }
    robotsCache.set(host, { disallow, at: now });
    return disallow;
  } catch {
    robotsCache.set(host, { disallow: [], at: now });
    return [];
  }
}

/** 判断某 URL 是否被目标站 robots.txt 禁止抓取。 */
export async function canFetch(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const disallow = await fetchRobotsDisallow(u.host);
    const path = u.pathname + u.search;
    return !disallow.some((p) => path.startsWith(p));
  } catch {
    return true;
  }
}

/** 把 HTML 剥离为纯文本，并截断到模型可接受的上下文长度。 */
export function stripHtml(html: string, maxChars = 60_000): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "…");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, maxChars);
}

export async function fetchHtml(
  url: string,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? MAX_RETRIES;
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "zh-CN,zh;q=0.9",
        },
        signal: ctrl.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
      const html = await res.text();
      return { html, text: stripHtml(html), status: res.status, finalUrl: res.url };
    } catch (err) {
      lastErr = err;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** 简单并发限制器：同时最多 concurrency 个任务。 */
export async function mapLimit<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** 把相对路径解析为绝对 URL。 */
export function resolveUrl(maybeRelative: string, base: string): string {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

/** 从列表页 HTML 中按厂商特定的路径正则发现详情页链接（比让 LLM 输出 href 更稳定）。 */
export function discoverUrls(html: string, pattern: string, base: string): string[] {
  const re = new RegExp(pattern, "gi");
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    found.add(resolveUrl(m[0], base));
  }
  return [...found];
}
