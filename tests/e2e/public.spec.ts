import { expect, test } from "@playwright/test";
test("homepage exposes the core case journey", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /企业 AI 改造/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /查看案例/ }).first(),
  ).toBeVisible();
});
test("case search and detail are usable", async ({ page }) => {
  await page.goto("/cases?q=OCR");
  await expect(page.getByText(/搜索结果/)).toBeVisible();
  const first = page.locator('a[aria-label^="查看案例"]').first();
  await expect(first).toBeVisible();
  await Promise.all([page.waitForURL(/\/cases\/[^/?#]+$/), first.click()]);
  await expect(page.getByRole("heading", { name: "信息来源" })).toBeVisible();
});
test("zero-result search gives useful next steps without leaking the query", async ({
  page,
}) => {
  await page.goto("/cases?q=definitely-no-such-case-2026");
  await expect(
    page.getByRole("heading", { name: "暂时没有完全匹配的案例" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "清除全部条件" })).toBeVisible();
  await expect(page.getByRole("link", { name: /开始免费体检/ })).toBeVisible();
});
test("assessment starts without registration", async ({ page }) => {
  await page.goto("/assessment");
  await expect(
    page.getByRole("heading", { name: "企业 AI 体检" }),
  ).toBeVisible();
  await expect(page.getByText("先了解你的企业")).toBeVisible();
});
test("private reports, status pages, admin and assessment are excluded from indexing", async ({
  request,
}) => {
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
test("invalid assessment status stops polling after the terminal response", async ({
  page,
}) => {
  let statusRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/assessment-jobs/invalid-status"))
      statusRequests += 1;
  });
  await page.goto("/assessment/status/invalid-status/invalid-report");
  await expect(page.getByText("本次任务未完成")).toBeVisible({
    timeout: 30_000,
  });
  const settledRequests = statusRequests;
  await page.waitForTimeout(4_500);
  expect(statusRequests).toBe(settledRequests);
});
test("development administrator can inspect assessment jobs", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/assessments");
  await expect(page.getByRole("heading", { name: "报告任务" })).toBeVisible();
  await expect(page.getByText("异步生成任务会出现在这里")).toBeVisible();
});
test("lead endpoints require consent and never report success when storage is unavailable", async ({
  request,
}) => {
  const contactInput = {
    type: "general",
    name: "验收",
    email: "qa@example.com",
    message: "这是一条生产存储行为验收信息",
  };
  const contactWithoutConsent = await request.post("/api/v1/contact", {
    data: contactInput,
  });
  expect(contactWithoutConsent.status()).toBe(400);
  const contact = await request.post("/api/v1/contact", {
    data: { ...contactInput, privacyConsent: true },
  });
  expect([201, 503]).toContain(contact.status());
  if (contact.status() === 503)
    expect((await contact.json()).code).toBe("CONTACT_STORAGE_NOT_CONFIGURED");
  const appointmentInput = {
    name: "验收",
    company: "测试企业",
    need: "希望核对第一阶段改造范围和数据准备",
    phone: "13800138000",
  };
  const appointmentWithoutConsent = await request.post("/api/v1/appointments", {
    data: appointmentInput,
  });
  expect(appointmentWithoutConsent.status()).toBe(400);
  const appointment = await request.post("/api/v1/appointments", {
    data: { ...appointmentInput, privacyConsent: true },
  });
  expect([200, 201, 503]).toContain(appointment.status());
  if (appointment.status() === 503)
    expect((await appointment.json()).code).toBe("LEAD_STORAGE_NOT_CONFIGURED");
  const assessmentInput = {
    industry: "制造业",
    size: "80人",
    business: "机械设备生产",
    repeatedWork: "销售每天整理询价并制作报价单",
    systems: "ERP 和 Excel",
    volume: "每月 500 份询价",
    laborCost: "每月约 3 万元",
    budget: "首期 10 万元以内",
    urgency: "3 个月内",
    goal: "缩短报价时间并减少复制错误",
    email: "qa@example.com",
  };
  const withoutConsent = await request.post("/api/v1/assessments", {
    data: assessmentInput,
  });
  expect(withoutConsent.status()).toBe(400);
  const withConsent = await request.post("/api/v1/assessments", {
    data: {
      ...assessmentInput,
      reportConsent: true,
      privacyConsent: true,
      marketingConsent: false,
    },
  });
  expect(withConsent.status()).toBe(503);
  expect((await withConsent.json()).code).toBe("REPORT_QUEUE_NOT_CONFIGURED");
});
test("contact, appointment and ROI anomalies require explicit confirmation", async ({
  page,
  request,
}) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("checkbox", { name: "同意联系信息隐私处理" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "提交信息" })).toBeDisabled();
  await page.goto("/appointment");
  await expect(
    page.getByRole("checkbox", { name: "同意预约信息隐私处理" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "提交预约" })).toBeDisabled();

  const anomaly = { investment: 0, monthlyCost: 0, monthlySaving: 10_000 };
  const blocked = await request.post("/api/v1/reports/demo/roi", {
    data: anomaly,
  });
  expect(blocked.status()).toBe(422);
  expect((await blocked.json()).code).toBe("ROI_INPUT_CONFIRMATION_REQUIRED");
  const confirmed = await request.post("/api/v1/reports/demo/roi", {
    data: { ...anomaly, anomaliesConfirmed: true },
  });
  expect(confirmed.status()).toBe(200);
  expect((await confirmed.json()).version.anomalyFlags.length).toBeGreaterThan(
    0,
  );
});
test("administrator can open governance workspaces", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  for (const [path, heading] of [
    ["organizations", "企业与实施方"],
    ["sources", "来源与采集记录"],
    ["corrections", "内容更正"],
    ["analytics", "SEO 与增长概览"],
    ["audit", "操作日志"],
  ] as const) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
test("sensitive administrator actions require a session and reauthentication", async ({
  page,
  request,
}) => {
  const unauthenticated = await Promise.all([
    request.post("/api/admin/appointments/export", {
      data: { password: "invalid-password" },
    }),
    request.post("/api/admin/assessments/missing/reveal", {
      data: { password: "invalid-password" },
    }),
    request.post("/api/admin/cases/missing/merge", {
      data: {
        targetCaseId: "target",
        reason: "这是用于验收的合并依据说明",
        password: "invalid-password",
      },
    }),
  ]);
  expect(unauthenticated.map((response) => response.status())).toEqual([
    401, 401, 401,
  ]);

  await page.goto("/admin/login");
  await page.getByLabel("管理员邮箱").fill("admin@aianliku.local");
  await page.getByLabel("密码").fill("aianliku-demo");
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/appointments");
  await page.getByRole("button", { name: "导出联系方式" }).click();
  await expect(
    page.getByRole("heading", { name: "导出敏感联系方式" }),
  ).toBeVisible();
  const response = await page.request.post("/api/admin/appointments/export", {
    data: { password: "aianliku-demo" },
  });
  expect(response.status()).toBe(503);
});
