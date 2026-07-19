import { describe, expect, it } from "vitest";
import { demoCases } from "@/data/demo-cases";
import { contentHash, duplicateLevel, normalizeOrganization, normalizeUrl, scoreDuplicate, textSimilarity } from "@/lib/dedup";
describe("deduplication", () => {
  it("normalizes tracking URLs without collapsing distinct paths", () => { expect(normalizeUrl("HTTPS://Example.com/a/?utm_source=x&b=2&a=1#part")).toBe("https://example.com/a?a=1&b=2"); expect(normalizeUrl("https://example.com/b")).not.toBe(normalizeUrl("https://example.com/a")); });
  it("normalizes common organization suffixes", () => { expect(normalizeOrganization("示例科技有限公司")).toBe(normalizeOrganization("示例科技")); });
  it("creates stable normalized content hashes", () => { expect(contentHash("  智能 报价\n案例 ")).toBe(contentHash("智能 报价 案例")); });
  it("detects similar Chinese titles", () => { expect(textSimilarity("订单OCR自动录入ERP", "使用OCR自动识别订单并录入ERP")).toBeGreaterThan(.35); });
  it("scores the same project higher than an unrelated project", () => { const existing = demoCases[0]; const same = scoreDuplicate({ title: existing.title, organization: existing.organization.name, scenario: existing.scenarios[0].slug, department: existing.businessFunctions[0], solution: existing.solution, result: existing.results[0].value, publishedAt: existing.publishedAt }, existing); const unrelated = scoreDuplicate({ title: "学校智能排课", organization: "另一所学校", scenario: "forecast", department: "教务" }, existing); expect(same.overall).toBeGreaterThan(unrelated.overall); expect(same.overall).toBeGreaterThan(.75); });
  it("uses the agreed review thresholds", () => { expect(duplicateLevel(.9)).toBe("high"); expect(duplicateLevel(.75)).toBe("medium"); expect(duplicateLevel(.749)).toBe("low"); });
});
