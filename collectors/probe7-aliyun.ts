import { chromium } from "playwright";

async function allCaseAnchors(page: import("playwright").Page): Promise<string[]> {
  return await page.$$eval("a", (els) => {
    const re = /customer-stories\/[a-z0-9]+(?:-[a-z0-9]+)+/;
    const out = new Set<string>();
    for (const a of els) {
      const href = a.getAttribute("href") || "";
      const abs = href.startsWith("http") ? href : `https://www.aliyun.com${href}`;
      if (re.test(abs) && !abs.includes("customer-case-index")) out.add(abs);
    }
    return [...out];
  });
}

async function clickCheckbox(page: import("playwright").Page, label: string) {
  // find label by text, then click its inner input
  const handle = await page.evaluateHandle((txt) => {
    const all = Array.from(document.querySelectorAll("*"));
    for (const e of all) {
      if ((e.textContent || "").trim() === txt) {
        const input = (e as HTMLElement).querySelector?.("input.ace-checkbox-input") as HTMLInputElement | null;
        if (input) return input;
        // also try parent label
        const parent = e.closest("label");
        const pin = parent?.querySelector("input.ace-checkbox-input") as HTMLInputElement | null;
        if (pin) return pin;
      }
    }
    return null;
  }, label);
  const el = handle.asElement();
  if (!el) {
    console.log(`  [${label}] no input found`);
    return false;
  }
  try {
    await el.click({ timeout: 4000, force: true });
    return true;
  } catch (e: any) {
    console.log(`  [${label}] click err ${e.message}`);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const reqs: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/customer|case|filter|solution|api|search|list/i.test(u)) reqs.push(u);
  });

  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const def = await allCaseAnchors(page);
  console.log("DEFAULT anchors:", def.length, def.slice(0, 4));

  reqs.length = 0;
  const ok = await clickCheckbox(page, "人工智能与机器学习");
  await page.waitForTimeout(3000);
  const ml = await allCaseAnchors(page);
  console.log(`CLICK ML ok=${ok} anchors=${ml.length}`);
  console.log("ML_SET_DIFF_FROM_DEFAULT:", ml.filter((x) => !def.includes(x)));
  console.log("DEFAULT_MINUS_ML:", def.filter((x) => !ml.includes(x)));
  console.log("REQUESTS_DURING_ML_CLICK:", JSON.stringify([...new Set(reqs)].slice(0, 15)));

  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
