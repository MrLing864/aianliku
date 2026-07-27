import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const handle = await page.evaluateHandle(() => {
    const all = Array.from(document.querySelectorAll("*"));
    for (const e of all) {
      if ((e.textContent || "").trim() === "人工智能与机器学习") {
        const input = (e as HTMLElement).querySelector?.("input.ace-checkbox-input") as HTMLInputElement | null;
        if (input) return input;
        const pin = e.closest("label")?.querySelector("input.ace-checkbox-input") as HTMLInputElement | null;
        if (pin) return pin;
      }
    }
    return null;
  });
  await (handle.asElement() as any)?.click({ timeout: 4000, force: true });
  await page.waitForTimeout(3000);

  const html = await page.$eval(".ace-customer-case-index-list-result-content", (el) => el.outerHTML.slice(0, 1500)).catch(() => "NONE");
  console.log("RESULT_CONTENT_OUTERHTML:\n", html);

  // also dump the result content card's text structure (company + summary)
  const cardText = await page.$eval(".ace-customer-case-index-list-result-content", (el) => {
    const cls = (c: string) => el.querySelector(c)?.getAttribute("title") || el.querySelector(c)?.textContent?.trim() || "";
    return {
      title_attr: el.querySelector(".card-title")?.getAttribute("title") || "",
      desc_attr: el.querySelector(".card-desc")?.getAttribute("title") || "",
      allText: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200),
    };
  }).catch(() => "NONE");
  console.log("CARD_TEXT:", JSON.stringify(cardText, null, 2));

  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
