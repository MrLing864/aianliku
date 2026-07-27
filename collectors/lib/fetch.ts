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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
