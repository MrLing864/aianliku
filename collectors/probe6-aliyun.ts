import { chromium } from "playwright";

async function dump(page: import("playwright").Page, label: string) {
  const cards = await page.$$eval(".card-text-content-box", (els) =>
    els.map((card) => {
      const t = card.querySelector(".card-title");
      const a = card.querySelector("a.jump-link") || card.querySelector("a");
      return {
        company: t?.getAttribute("title") || t?.textContent?.trim() || "",
        url: a?.getAttribute("href") || "",
      };
    }),
  );
  console.log(`[${label}] count=${cards.length}`);
  console.log(`${label}_CARDS:`, JSON.stringify(cards));
}

async function clickText(page: import("playwright").Page, text: string) {
  for (const h of await page.$$("*")) {
    if ((await h.textContent())?.trim() === text) {
      try {
        await h.click({ timeout: 4000 });
        return;
      } catch {
        const p = await h.evaluateHandle((e) => e.parentElement);
        try {
          await (p.asElement() as any)?.click({ timeout: 4000 });
          return;
        } catch {}
      }
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  await dump(page, "DEFAULT");

  await clickText(page, "人工智能与机器学习");
  await page.waitForTimeout(2500);
  await dump(page, "ML");

  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  await clickText(page, "AI");
  await page.waitForTimeout(2500);
  await dump(page, "AI");

  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
