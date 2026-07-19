import { expect, test } from "@playwright/test";
test("homepage exposes the core case journey", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /企业 AI 改造/ })).toBeVisible(); await expect(page.getByRole("link", { name: /查看案例/ }).first()).toBeVisible(); });
test("case search and detail are usable", async ({ page }) => { await page.goto("/cases?q=OCR"); await expect(page.getByText(/搜索结果/)).toBeVisible(); const first = page.locator('a[aria-label^="查看案例"]').first(); await expect(first).toBeVisible(); await first.click(); await expect(page.getByRole("heading", { name: "信息来源" })).toBeVisible(); });
test("assessment starts without registration", async ({ page }) => { await page.goto("/assessment"); await expect(page.getByRole("heading", { name: "企业 AI 体检" })).toBeVisible(); await expect(page.getByText("先了解你的企业")).toBeVisible(); });
test("private reports and admin are excluded from indexing", async ({ request }) => { const robots = await request.get("/robots.txt"); expect(await robots.text()).toContain("Disallow: /admin/"); expect(await robots.text()).toContain("Disallow: /reports/"); });
test("invalid assessment status stops polling after the terminal response", async ({ page }) => {
  let statusRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/assessment-jobs/invalid-status")) statusRequests += 1;
  });
  await page.goto("/assessment/status/invalid-status/invalid-report");
  await expect(page.getByText("本次任务未完成")).toBeVisible();
  const settledRequests = statusRequests;
  await page.waitForTimeout(4_500);
  expect(statusRequests).toBe(settledRequests);
});
test("development administrator can inspect assessment jobs", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/assessments");
  await expect(page.getByRole("heading", { name: "报告任务" })).toBeVisible();
  await expect(page.getByText("异步生成任务会出现在这里")).toBeVisible();
});
