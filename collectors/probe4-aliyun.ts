import { discoverAliyunListItems } from "./lib/aliyun";
import { chromium } from "playwright";

async function main() {
  const { chromium: c } = await import("playwright");
  const browser = await c.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  // click ML filter
  const handles = await page.$$("*");
  for (const h of handles) {
    if ((await h.textContent())?.trim() === "人工智能与机器学习") {
      await h.click({ timeout: 4000 }).catch(() => {});
      break;
    }
  }
  await page.waitForTimeout(2000);

  const counts: number[] = [];
  for (let i = 0; i < 16; i++) {
    const n = await page.$$eval(".card-text-content-box", (els) => els.length);
    counts.push(n);
    // detect load-more buttons
    const more = await page.$$eval("button, a, div", (els) =>
      els.map((e) => (e.textContent || "").trim()).filter((t) => /加载更多|查看更多|下一页|加载更多案例/.test(t)),
    );
    if (i === 0) console.log("LOAD_MORE_CANDIDATES:", JSON.stringify([...new Set(more)]));
    // scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    // click any load-more
    let clicked = false;
    for (const h of await page.$$("button, a")) {
      const t = (await h.textContent())?.trim() || "";
      if (/加载更多|查看更多|下一页|加载更多案例/.test(t)) {
        try {
          await h.click({ timeout: 3000 });
          clicked = true;
          break;
        } catch {}
      }
    }
    if (clicked) await page.waitForTimeout(1200);
  }
  console.log("CARD_COUNTS_OVER_SCROLLS:", JSON.stringify(counts));
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
