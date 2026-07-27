import { chromium } from "playwright";

const INDEX = "https://www.aliyun.com/customer-stories/customer-case-index";
const CASE_RE = /https:\/\/www\.aliyun\.com\/customer-stories\/[a-z0-9]+(?:-[a-z0-9]+)+/g;

async function getCaseLinks(page: import("playwright").Page): Promise<string[]> {
  return await page.$$eval("a", (els) => {
    const re = /https:\/\/www\.aliyun\.com\/customer-stories\/[a-z0-9]+(?:-[a-z0-9]+)+/;
    const out = new Set<string>();
    for (const a of els) {
      const href = a.getAttribute("href") || "";
      const abs = href.startsWith("http") ? href : `https://www.aliyun.com${href}`;
      if (re.test(abs) && !abs.includes("customer-case-index")) out.add(abs);
    }
    return [...out];
  });
}

async function clickByText(page: import("playwright").Page, text: string): Promise<boolean> {
  const handles = await page.$$("*");
  for (const h of handles) {
    const t = (await h.textContent())?.trim();
    if (t === text) {
      const tag = (await h.evaluate((e) => e.tagName)).toLowerCase();
      if (tag === "a" || tag === "button" || tag === "li" || tag === "span" || tag === "div") {
        try {
          await h.click({ timeout: 4000 });
          return true;
        } catch {
          // try parent
          const parent = await h.evaluateHandle((e) => e.parentElement);
          try {
            await (parent.asElement() as any)?.click({ timeout: 4000 });
            return true;
          } catch {
            /* ignore */
          }
        }
      }
    }
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  await page.goto(INDEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  console.log("INITIAL_URL:", page.url());

  // Dump candidate filter elements (text + tag + class + href)
  const filters = await page.$$eval("*", (els) => {
    const wanted = ["人工智能与机器学习", "AI", "全部行业", "技术解决方案", "产品类别", "全部"];
    const out: any[] = [];
    const seen = new Set<string>();
    for (const e of els) {
      const t = (e.textContent || "").trim();
      if (t && wanted.includes(t)) {
        const key = `${e.tagName}|${t}|${(e.className && e.className.toString) ? e.className.toString().slice(0, 60) : ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          tag: e.tagName,
          text: t,
          cls: e.className?.toString?.()?.slice(0, 80) || "",
          href: e.getAttribute?.("href") || null,
          parentCls: e.parentElement?.className?.toString?.()?.slice(0, 80) || "",
        });
      }
    }
    return out.slice(0, 60);
  });
  console.log("FILTER_ELEMENTS:", JSON.stringify(filters, null, 2));

  // Baseline (no filter) case links
  const baseLinks = await getCaseLinks(page);
  console.log(`BASELINE_CASE_LINKS(${baseLinks.length}):`, baseLinks.slice(0, 5));

  // Click "人工智能与机器学习"
  const ok1 = await clickByText(page, "人工智能与机器学习");
  await page.waitForTimeout(2500);
  const url1 = page.url();
  const links1 = await getCaseLinks(page);
  console.log(`CLICK[人工智能与机器学习] ok=${ok1} url=${url1} links=${links1.length}`);
  console.log("SAMPLE1:", links1.slice(0, 8));

  // Reload to reset filters, then click "AI"
  await page.goto(INDEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);
  const ok2 = await clickByText(page, "AI");
  await page.waitForTimeout(2500);
  const url2 = page.url();
  const links2 = await getCaseLinks(page);
  console.log(`CLICK[AI] ok=${ok2} url=${url2} links=${links2.length}`);
  console.log("SAMPLE2:", links2.slice(0, 8));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
