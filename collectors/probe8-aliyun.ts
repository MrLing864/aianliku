import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  // click hidden input for ML
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

  // For each case anchor, find its card container and report tag/class/text snippet
  const info = await page.$$eval("a", (els) => {
    const re = /customer-stories\/[a-z0-9]+(?:-[a-z0-9]+)+/;
    const out: any[] = [];
    const seen = new Set<string>();
    for (const a of els) {
      const href = a.getAttribute("href") || "";
      const abs = href.startsWith("http") ? href : `https://www.aliyun.com${href}`;
      if (!re.test(abs) || abs.includes("customer-case-index")) continue;
      if (seen.has(abs)) continue;
      seen.add(abs);
      // climb up to find a container with a class
      let node: any = a;
      let depth = 0;
      let containerCls = "";
      while (node && depth < 6) {
        const cls = node.className?.toString?.() || "";
        if (cls && /card|case|item|list|col|box/i.test(cls)) {
          containerCls = `${node.tagName}.${cls.slice(0, 60)}`;
          break;
        }
        node = node.parentElement;
        depth++;
      }
      out.push({
        url: abs,
        containerCls,
        text: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
      });
    }
    return out;
  });
  console.log("FILTERED_CARD_COUNT:", info.length);
  console.log(JSON.stringify(info.slice(0, 6), null, 2));
  // unique container classes
  const classes = [...new Set(info.map((i) => i.containerCls))];
  console.log("CONTAINER_CLASSES:", JSON.stringify(classes));

  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
