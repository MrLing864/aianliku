/**
 * 栏目发现辅助脚本：给定官网域名，自动扫出"疑似宣传/案例/新闻"栏目候选，供人工确认。
 *
 * 用法：
 *   tsx collectors/lib/scaffold_columns.ts <domain> [--limit=30]
 *   tsx collectors/lib/scaffold_columns.ts icbc.com.cn
 *
 * 策略：
 * 1) 请求首页 + 一组常见栏目路径，收集页面里的同域链接；
 * 2) 按"是否含案例/新闻/标杆/方案等关键词"打分排序，输出候选栏目清单；
 * 3) 人从该清单挑出真入口，填进 government/companies 的 sources.ts 并标 verified=true。
 *
 * 注意：本脚本只做"发现候选"，不写库、不调用 LLM。
 */

import { fetchHtml, discoverUrls, canFetch } from "./fetch";

const COMMON_PATHS = [
  "/about/news", "/news", "/news-center", "/media", "/press",
  "/case", "/cases", "/customer", "/customer-case", "/success-story", "/benchmark",
  "/solution", "/solutions", "/smart", "/digital", "/ai", "/innovation",
  "/esg", "/investor", "/ir", "/ztzl", "/xxgk", "/zwgk", "/kf",
];

const SCORE_KEYWORDS: { kw: RegExp; score: number }[] = [
  { kw: /(案例|case|cases)/i, score: 5 },
  { kw: /(客户|customer|标杆|benchmark|典型)/i, score: 5 },
  { kw: /(解决方案|solution|solutions)/i, score: 4 },
  { kw: /(新闻|动态|资讯|news|press|media)/i, score: 3 },
  { kw: /(智能|数字化|digital|smart|ai|大模型)/i, score: 3 },
  { kw: /(专题|专栏|ztzl|成效|应用)/i, score: 2 },
];

function scoreUrl(url: string): number {
  let s = 0;
  for (const { kw, score } of SCORE_KEYWORDS) if (kw.test(url)) s += score;
  return s;
}

async function tryFetch(base: string, path: string): Promise<string> {
  const u = base + (path === "/" ? "" : path);
  if (!(await canFetch(u))) return "";
  try {
    const r = await fetchHtml(u, { timeoutMs: 15000 });
    return r.html || "";
  } catch {
    return "";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const domain = args[0];
  if (!domain) {
    console.error("用法: tsx collectors/lib/scaffold_columns.ts <domain> [--limit=30]");
    process.exit(1);
  }
  const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "30", 10) || 30;

  const base = `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  console.log(`[scaffold] 扫描域名：${base}`);

  // 1) 首页 + 常见路径
  const htmls: string[] = [];
  const home = await tryFetch(base, "/");
  if (home) htmls.push(home);
  const pathHtmls = await Promise.all(COMMON_PATHS.slice(0, 12).map((p) => tryFetch(base, p)));
  htmls.push(...pathHtmls.filter(Boolean));

  // 2) 抽取同域链接
  const found = new Set<string>();
  for (const html of htmls) {
    if (!html) continue;
    const urls = discoverUrls(html, "https?://[\\w.-]*" + domain.replace(".", "\\.") + "(?:/[\\w/-]*)?", base);
    for (const u of urls) found.add(u.split("?")[0].replace(/\/$/, ""));
  }

  // 3) 打分排序
  const scored = [...found]
    .map((u) => ({ url: u, score: scoreUrl(u) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  console.log(`\n[scaffold] 候选栏目（按相关性排序，待人工确认 verified=true）：\n`);
  for (const x of scored) {
    console.log(`  [score=${x.score}] ${x.url}`);
  }
  console.log(`\n共 ${scored.length} 个候选。请人工挑选真正的"案例/新闻/标杆"入口，填入 sources.ts 并标 verified=true。`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
