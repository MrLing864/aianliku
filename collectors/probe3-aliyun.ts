import { chromium, type Page } from "playwright";

const INDEX = "https://www.aliyun.com/customer-stories/customer-case-index";

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

async function dumpCards(page: Page) {
  // find card containers: links to /customer-stories/ that wrap a card
  const cards = await page.$$eval("a[href*='customer-stories/']", (els) => {
    const out: any[] = [];
    for (const a of els) {
      const href = a.getAttribute("href") || "";
      if (href.includes("customer-case-index")) continue;
      const card = a.closest("div") || a;
      const txt = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (txt.length < 4) continue;
      out.push({
        href,
        cls: a.className?.toString?.()?.slice(0, 70) || "",
        textLen: txt.length,
        text: txt.slice(0, 200),
      });
    }
    return out.slice(0, 6);
  });
  return cards;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(INDEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  await clickByText(page, "人工智能与机器学习");
  await page.waitForTimeout(2000);
  const cards = await dumpCards(page);
  console.log("CARDS_AFTER_ML:", JSON.stringify(cards, null, 2));

  // Also dump the outer HTML of the first card to find structure
  const firstCardHtml = await page.$eval("a[href*='customer-stories/']:not([href*='customer-case-index'])", (a) => {
    const card = a.closest("div") || a;
    return card.outerHTML.slice(0, 1200);
  }).catch(() => "NONE");
  console.log("FIRST_CARD_OUTERHTML:", firstCardHtml);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
