import { describe, expect, it } from "vitest";
import { buildFingerprintFromText, lexicalSimilarity } from "./fingerprint";
import { scoreDuplicate } from "./scoring";
import { buildSegments, splitSegments } from "./segment";
import { buildSourceIdentity, contentHash, normalizeUrl } from "./source-identity";

describe("dedup v2 source identity", () => {
  it("keeps business query parameters but removes tracking parameters", () => {
    const first = normalizeUrl("https://WWW.Example.com/case?id=1&utm_source=test#detail");
    const same = normalizeUrl("http://example.com/case?utm_medium=cpc&id=1");
    const different = normalizeUrl("https://example.com/case?id=2");

    expect(first).toBe("example.com/case?id=1");
    expect(same).toBe(first);
    expect(different).not.toBe(first);
  });

  it("uses the complete normalized content for a stable SHA-256 identity", () => {
    const prefix = "甲".repeat(2_100);
    expect(contentHash("案例", `${prefix}A`)).not.toBe(contentHash("案例", `${prefix}B`));
    expect(buildSourceIdentity({ title: "案例", rawText: "正文" }).contentHash).toHaveLength(64);
  });
});

describe("dedup v2 source segmentation", () => {
  it("does not turn ordinary case sections into separate projects", () => {
    const text = "业务背景\n企业订单很多\n\n遇到的问题\n重复录入\n\nAI解决方案\n自动识别订单\n\n最终效果\n录入时间下降50%";
    expect(splitSegments(text)).toHaveLength(1);
  });

  it("splits a report only when it contains multiple explicit case headings", () => {
    const text = "案例一\n甲公司自动报价项目\n\n背景\n报价慢\n\n案例二\n乙公司客服助手\n\n效果\n响应更快";
    expect(splitSegments(text)).toHaveLength(2);
  });

  it("builds stable segment ids for idempotent retries", () => {
    const input = {
      sourceId: "src_1",
      title: "甲公司自动报价",
      rawText: "解决方案：自动读取询价单并生成报价草案。",
      organizationMention: "甲公司",
      organizationId: "org_1",
    };
    expect(buildSegments(input)[0].id).toBe(buildSegments(input)[0].id);
  });
});

describe("dedup v2 project scoring", () => {
  it("produces useful Chinese lexical similarity", () => {
    const left = buildFingerprintFromText({
      title: "订单OCR自动录入ERP",
      rawText: "识别订单字段并自动录入业务系统",
    });
    const right = buildFingerprintFromText({
      title: "用OCR识别订单并录入ERP",
      rawText: "自动提取订单信息，减少人工录入",
    });
    expect(lexicalSimilarity(left.lexicalVector, right.lexicalVector)).toBeGreaterThan(0.25);
  });

  it("scores the same structured project above an unrelated project", () => {
    const existing = buildFingerprintFromText({
      title: "自动报价项目",
      rawText: "销售部门读取图纸后自动生成报价，周期缩短50%",
      organizationId: "org_1",
      scenario: "quotation",
      department: "销售",
      solution: "读取图纸并生成报价",
      result: "周期缩短50%",
    });
    const same = buildFingerprintFromText({
      title: "AI自动报价系统",
      rawText: "销售读取图纸自动形成报价草案，耗时下降50%",
      organizationId: "org_1",
      scenario: "quotation",
      department: "销售",
      solution: "读取图纸并生成报价草案",
      result: "耗时下降50%",
    });
    const unrelated = buildFingerprintFromText({
      title: "客服知识助手",
      rawText: "客服部门检索知识并回答问题",
      organizationId: "org_1",
      scenario: "customer-service",
      department: "客服",
      solution: "检索知识并回答问题",
    });

    const sameScore = scoreDuplicate({
      incoming: same,
      existing,
      hasOrgRelation: false,
      hasExplicitConflict: false,
    }).score;
    const unrelatedScore = scoreDuplicate({
      incoming: unrelated,
      existing,
      hasOrgRelation: false,
      hasExplicitConflict: false,
    }).score;
    expect(sameScore).toBeGreaterThan(unrelatedScore);
  });
});
