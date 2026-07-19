import { expect, test } from "@playwright/test";
test("homepage exposes the core case journey", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /企业 AI 改造/ })).toBeVisible(); await expect(page.getByRole("link", { name: /查看案例/ }).first()).toBeVisible(); });
test("case search and detail are usable", async ({ page }) => {
  await page.goto("/cases?q=OCR");
  await expect(page.getByText(/搜索结果/)).toBeVisible();
  const first = page.locator('a[aria-label^="查看案例"]').first();
  await expect(first).toBeVisible();
  await Promise.all([page.waitForURL(/\/cases\/[^/?#]+$/), first.click()]);
  await expect(page.getByRole("heading", { name: "信息来源" })).toBeVisible();
});
test("assessment starts without registration", async ({ page }) => { await page.goto("/assessment"); await expect(page.getByRole("heading", { name: "企业 AI 体检" })).toBeVisible(); await expect(page.getByText("先了解你的企业")).toBeVisible(); });
test("private reports, status pages, admin and assessment are excluded from indexing", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin/");
  expect(robotsText).toContain("Disallow: /reports/");
  expect(robotsText).toContain("Disallow: /assessment/status/");
  const sitemap = await request.get("/sitemap.xml");
  const sitemapText = await sitemap.text();
  expect(sitemapText).not.toContain("/assessment</loc>");
  expect(sitemapText).not.toContain("/admin/");
  const report = await request.get("/reports/demo");
  expect(report.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  expect(report.headers()["x-robots-tag"]).toContain("noindex");
});
test("invalid assessment status stops polling after the terminal response", async ({ page }) => {
  let statusRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/assessment-jobs/invalid-status")) statusRequests += 1;
  });
  await page.goto("/assessment/status/invalid-status/invalid-report");
  await expect(page.getByText("本次任务未完成")).toBeVisible({ timeout: 15_000 });
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
test("lead endpoints never report success when storage is unavailable", async ({ request }) => {
  const contact = await request.post("/api/v1/contact", { data: { type: "general", name: "验收", contact: "qa@example.com", message: "这是一条生产存储行为验收信息" } });
  expect([201, 503]).toContain(contact.status());
  if (contact.status() === 503) expect((await contact.json()).code).toBe("CONTACT_STORAGE_NOT_CONFIGURED");
  const appointment = await request.post("/api/v1/appointments", { data: { name: "验收", company: "测试企业", need: "希望核对第一阶段改造范围和数据准备", phone: "13800138000" } });
  expect([200, 201, 503]).toContain(appointment.status());
  if (appointment.status() === 503) expect((await appointment.json()).code).toBe("LEAD_STORAGE_NOT_CONFIGURED");
});
test("administrator can open governance workspaces", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  for (const [path, heading] of [["organizations", "企业与实施方"], ["sources", "来源与采集记录"], ["corrections", "内容更正"], ["analytics", "SEO 与增长概览"], ["audit", "操作日志"]] as const) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
test("sensitive administrator actions require a session and reauthentication", async ({ page, request }) => {
  const unauthenticated = await Promise.all([
    request.post("/api/admin/appointments/export", { data: { password: "invalid-password" } }),
    request.post("/api/admin/assessments/missing/reveal", { data: { password: "invalid-password" } }),
    request.post("/api/admin/cases/missing/merge", { data: { targetCaseId: "target", reason: "这是用于验收的合并依据说明", password: "invalid-password" } }),
  ]);
  expect(unauthenticated.map((response) => response.status())).toEqual([401, 401, 401]);

  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/appointments");
  await page.getByRole("button", { name: "导出联系方式" }).click();
  await expect(page.getByRole("heading", { name: "导出敏感联系方式" })).toBeVisible();
  const response = await page.request.post("/api/admin/appointments/export", { data: { password: "aianliku-demo" } });
  expect(response.status()).toBe(503);
});
