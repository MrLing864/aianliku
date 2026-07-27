import { chromium, type Page } from "playwright";

const INDEX = "https://www.aliyun.com/customer-stories/customer-case-index";
const CASE_RE = /https:\/\/www\.aliyun\.com\/customer-stories\/[a-z0-9]+(?:-[a-z0-9]+)+/;

async function getCaseLinks(page: Page): Promise<string[]> {
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

async function clickByText(page: Page, text: string): Promise<boolean> {
  const handles = await page.$$("*");
  for (const h of handles) {
    const t = (await h.textContent())?.trim();
    if (t === text) {
      const tag = (await h.evaluate((e) => e.tagName)).toLowerCase();
      if (["a", "button", "li", "span", "div", "label"].includes(tag)) {
        try {
          await h.click({ timeout: 4000 });
          return true;
        } catch {
          const parent = await h.evaluateHandle((e) => e.parentElement);
          try {
            await (parent.asElement() as any)?.click({ timeout: 4000 });
            return true;
          } catch {}
        }
      }
    }
  }
  return false;
}

async function collectFiltered(page: Page, label: string): Promise<string[]> {
  const ok = await clickByText(page, label);
  if (!ok) console.log(`  [${label}] click failed`);
  await page.waitForTimeout(2000);
  const all = new Set<string>();
  // click "加载更多" / "查看更多" up to 10 times
  for (let i = 0; i < 12; i++) {
    const links = await getCaseLinks(page);
    links.forEach((l) => all.add(l));
    const more = await page.$$eval("button, a, div", (els) => {
      const out: string[] = [];
      for (const e of els) {
        const t = (e.textContent || "").trim();
        if (t === "加载更多" || t === "查看更多" || t === "加载更多案例" || t.includes("下一页")) out.push(t);
      }
      return out;
    });
    if (more.length === 0) break;
    let clicked = false;
    for (const h of await page.$$("button, a")) {
      const t = (await h.textContent())?.trim();
      if (t === "加载更多" || t === "查看更多" || t === "加载更多案例" || t.includes("下一页")) {
        try {
          await h.click({ timeout: 3000 });
          clicked = true;
          break;
        } catch {}
      }
    }
    if (!clicked) break;
    await page.waitForTimeout(1500);
  }
  return [...all];
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  await page.goto(INDEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  const linksML = await collectFiltered(page, "人工智能与机器学习");
  console.log(`FILTER[人工智能与机器学习] total=${linksML.length}`);

  await page.goto(INDEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);
  const linksAI = await collectFiltered(page, "AI");
  console.log(`FILTER[AI] total=${linksAI.length}`);

  const union = new Set([...linksML, ...linksAI]);
  console.log(`UNION total=${union.size}`);
  console.log("UNION_SAMPLE:", [...union].slice(0, 10));

  // Probe a detail page
  const first = [...union][0];
  console.log("\n=== DETAIL PROBE:", first, "===");
  await page.goto(first, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  const meta = await page.evaluate(() => {
    const keys = Object.keys(window as any).filter(
      (k) => /data|state|case|customer|page|__|initial/i.test(k),
    );
    const asyncMarker = (window as any)["__ASYNC_DATA__"] ? "HAS __ASYNC_DATA__" : "NO __ASYNC_DATA__";
    const title = document.title;
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    return { keys: keys.slice(0, 40), asyncMarker, title, h1, metaDesc };
  });
  console.log("DETAIL_META:", JSON.stringify(meta, null, 2));

  const text = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
    return clone.textContent?.replace(/\s+/g, " ").trim().slice(0, 1800);
  });
  console.log("DETAIL_TEXT(head):", text);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
