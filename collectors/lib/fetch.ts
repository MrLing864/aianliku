/**
 * 通用抓取工具：带反爬绕过、UA 轮换、超时、重试退避、并发限制的 HTML 抓取，并输出去噪后的纯文本。
 * 不依赖 cheerio，避免引入额外依赖；HTML→文本用轻量正则剥离即可满足 LLM 抽取需求。
 *
 * 反爬策略（仅针对公开页面，遵守 robots.txt）：
 * 1) UA 池轮换：避免单一 UA 被指纹识别拦截；
 * 2) 完整浏览器请求头：Referer(同域)、Accept-Encoding、sec-fetch-*、sec-ch-ua 系列，模拟真实 Chrome；
 * 3) keep-alive 连接复用：降低「新连接即封锁」概率；
 * 4) 指数退避重试：403/429/503 时轮换 UA 并加长等待；
 * 5) 可选代理：支持 HTTPS_PROXY 环境变量注入（服务器有代理时自动生效）；
 * 6) 自适应微延迟：请求间加入随机抖动，避免固定节奏。
 */

// ── UA / 头池 ─────────────────────────────────────────────
const DESKTOP_UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 构造接近真实 Chrome 的请求头；referer 默认同域（降低跨站拦截）。 */
function buildHeaders(url: string): Record<string, string> {
  const u = new URL(url);
  const origin = `${u.protocol}//${u.host}`;
  const ua = pick(DESKTOP_UAS);
  return {
    "User-Agent": ua,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-CH": "sec-ch-ua,sec-ch-ua-mobile,sec-ch-ua-platform",
    "Sec-CH-UA": `"Chromium";v="124", "Google Chrome";v="124", "Not:A-Brand";v="99"`,
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": `"${u.host.includes("mac") ? "macOS" : "Windows"}"`,
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    Referer: origin + "/",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
}

// ── keep-alive dispatcher（连接复用，降低封锁概率）─────────
// 优先使用代理（若配置了 HTTPS_PROXY），否则 keep-alive 直连。
let sharedDispatcher: unknown | null = null;
let dispatcherReady = false;
async function getDispatcher(): Promise<unknown | undefined> {
  if (dispatcherReady) return sharedDispatcher;
  dispatcherReady = true;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || "";
  try {
    const mod = (await import("undici")) as { Agent?: new (o: object) => unknown; ProxyAgent?: new (p: string) => unknown };
    if (proxy && mod.ProxyAgent) {
      sharedDispatcher = new mod.ProxyAgent(proxy);
    } else if (mod.Agent) {
      sharedDispatcher = new mod.Agent({ connections: 8, keepAliveTimeout: 60_000, headersTimeout: 30_000 });
    }
  } catch {
    sharedDispatcher = undefined; // 无 undici 时退回默认 fetch
  }
  return sharedDispatcher;
}

// ── 配置 ─────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_RETRIES = 4;

export interface FetchResult {
  html: string;
  text: string;
  status: number;
  finalUrl: string;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 自适应微延迟：在并发请求间加入随机抖动，避免固定节奏被识别为爬虫。 */
function jitterDelay(base = 200): number {
  return base + Math.floor(Math.random() * 600); // 200~800ms
}

/**
 * 轻量 robots.txt 合规检查：仅允许抓取未被目标站点 Disallow 的路径。
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

// ── Playwright 渲染兜底（SPA 站点）─────────────────────────
// 仅当静态 HTML 抽不到详情链接时按需调用；单例浏览器复用，避免反复启动。
let pwBrowser: unknown | null = null;
let pwLaunching: Promise<unknown> | null = null;

async function getPlaywrightBrowser(): Promise<unknown | null> {
  if (pwBrowser) return pwBrowser;
  if (pwLaunching) return pwLaunching;
  pwLaunching = (async () => {
    try {
      const pw = (await import("playwright")) as { chromium: { launch: (o: object) => Promise<unknown> } };
      pwBrowser = await pw.chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
      console.log("[fetch] Playwright chromium 已启动（渲染兜底就绪）");
      return pwBrowser;
    } catch (e) {
      console.warn(`[fetch] 渲染兜底不可用（缺少 playwright/chromium）：${(e as Error).message}`);
      return null;
    } finally {
      pwLaunching = null;
    }
  })();
  return pwLaunching;
}

/**
 * 用 Playwright 渲染 SPA 页面并返回执行 JS 后的完整 HTML。
 * 用于静态 fetchHtml 抽不到详情链接的站点（如讯飞 cases.html、阿里 news 等 React/Vue 渲染页）。
 * 失败时返回空字符串（调用方应回退泛搜或跳过），不抛异常。
 */
export async function renderHtml(url: string, opts: { timeoutMs?: number; waitFor?: string } = {}): Promise<string> {
  const browser = await getPlaywrightBrowser();
  if (!browser) return "";
  const timeoutMs = opts.timeoutMs ?? 20_000;
  let page: unknown | null = null;
  try {
    const b = browser as { newPage: () => Promise<unknown> };
    page = await b.newPage();
    const p = page as {
      setDefaultTimeout: (n: number) => void;
      setDefaultNavigationTimeout: (n: number) => void;
      goto: (u: string, o: object) => Promise<void>;
      waitForTimeout: (n: number) => Promise<void>;
      content: () => Promise<string>;
    };
    p.setDefaultTimeout(timeoutMs);
    p.setDefaultNavigationTimeout(timeoutMs);
    // 用 domcontentloaded 而非 networkidle：SPA 常有长轮询/统计请求，networkidle 永不触发会卡满超时
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    // 给客户端渲染/懒加载一点时间
    await p.waitForTimeout(2500);
    if (opts.waitFor) {
      try {
        await (page as { waitForSelector: (s: string, o: object) => Promise<void> }).waitForSelector(opts.waitFor, { timeout: timeoutMs });
      } catch {
        /* 选择器不存在则忽略，直接取当前内容 */
      }
    }
    return await p.content();
  } catch (e) {
    console.warn(`[fetch] 渲染失败 ${url}：${(e as Error).message}`);
    return "";
  } finally {
    if (page) {
      try {
        await (page as { close: () => Promise<void> }).close();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * 带反爬绕过的 HTML 抓取。
 * - UA 轮换 + 完整浏览器头
 * - 403/429/503 时轮换 UA 并指数退避重试
 * - keep-alive 连接复用
 * - 可选 HTTPS_PROXY 代理
 */
export async function fetchHtml(
  url: string,
  opts: { timeoutMs?: number; retries?: number; noDelay?: boolean } = {},
): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? MAX_RETRIES;
  let lastErr: unknown;

  if (!opts.noDelay) await sleep(jitterDelay());

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const init: RequestInit & { dispatcher?: unknown; agent?: unknown } = {
        headers: buildHeaders(url),
        signal: ctrl.signal,
        redirect: "follow",
      };
      const dispatcher = await getDispatcher();
      if (dispatcher && typeof dispatcher === "object") (init as Record<string, unknown>).dispatcher = dispatcher;
      const res = await fetch(url, init as RequestInit);
      clearTimeout(timer);
      if (res.status === 403 || res.status === 429 || res.status === 503) {
        // 反爬拦截：轮换 UA 并退避，再次尝试
        const wait = Math.min(3000, 500 * Math.pow(2, attempt));
        await sleep(wait);
        lastErr = new Error(`HTTP ${res.status}（反爬拦截）@ ${url}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
      const buf = await res.arrayBuffer();
      const html = Buffer.from(buf).toString("utf-8");
      return { html, text: stripHtml(html), status: res.status, finalUrl: res.url };
    } catch (err) {
      lastErr = err;
      const wait = Math.min(4000, 500 * Math.pow(2, attempt));
      await sleep(wait);
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
