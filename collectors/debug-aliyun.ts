import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("aliyun.com") || url.includes("alicdn.com")) {
      requests.push(url);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("case") || url.includes("customer")) {
      try {
        const body = await res.text();
        console.log("=== RESPONSE ===");
        console.log("URL:", url);
        console.log("Length:", body.length);
        console.log("Preview:", body.slice(0, 500));
        console.log("================");
      } catch {}
    }
  });

  await page.goto("https://www.aliyun.com/customer-stories/customer-case-index", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  // Extract data from the page
  const scripts = await page.$$eval("script", (els) =>
    els.map((el) => el.textContent).filter(Boolean)
  );

  for (const s of scripts) {
    if (s && (s.includes("customer") || s.includes("caseList") || s.includes("customerCase"))) {
      console.log("=== SCRIPT with customer data ===");
      console.log(s.slice(0, 2000));
      console.log("================================");
    }
  }

  // Try to find the API endpoint
  const pageHtml = await page.content();
  const apiMatches = pageHtml.match(/https?:\/\/[^\s"'<>]+(?:customer|case)[^\s"'<>]*(?:api|data|query|rest)[^\s"'<>]*/gi) || [];
  console.log("=== API URL Matches ===");
  console.log([...new Set(apiMatches)].join("\n"));

  // Try to look at localStorage or sessionStorage
  const localData = await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  });
  console.log("=== localStorage keys ===", localData);

  // Try to find a hidden __DATA__ or __INITIAL_STATE__ global
  const globalKeys = await page.evaluate(() => {
    const keys = Object.keys(window).filter(
      (k) => k.includes("data") || k.includes("DATA") || k.includes("state") || k.includes("STATE") || k.includes("case") || k.includes("customer")
    ).slice(0, 30);
    return keys;
  });
  console.log("=== global keys ===", globalKeys);

  // Look at network requests for the customer case data
  const filteredRequests = [...new Set(requests)].filter(
    (u) => u.includes("case") || u.includes("customer") || u.includes("data")
  );
  console.log("=== Filtered Requests ===");
  filteredRequests.forEach((r) => console.log(r));

  await browser.close();
}

main().catch(console.error);
