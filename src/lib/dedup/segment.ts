/**
 * 来源片段生成（计划二.5 / 三.1）
 *
 * 解决「一篇研报或汇总页包含多个案例」的问题。
 * 唯一约束为 sourceId + segmentKey，而非单独使用 URL。
 * 一个来源可生成多个 segment；重复抓取相同 segment 时只更新采集时间。
 *
 * 默认按“一条导入记录就是一个案例”保守处理。只有文本中出现至少两个明确的
 * “案例一/案例二”标题时才拆分，避免把业务背景、解决方案、效果等段落误当成多个案例。
 */
import { contentHash } from "./source-identity";
import { buildFingerprintFromText, emptyFingerprint } from "./fingerprint";
import type { SourceCaseSegment, CaseFingerprint } from "./types";

export interface SegmentInput {
  sourceId: string;
  title: string;
  rawText: string;
  organizationMention?: string;
  organizationId?: string;
  externalCaseId?: string;
  scenario?: string;
  department?: string;
  implementer?: string;
  solution?: string;
  result?: string;
}

export interface RawSegment {
  title: string;
  sectionTitle?: string;
  locator?: string;
  rawExcerpt: string;
  organizationMention?: string;
}

function isCaseHeading(value: string): boolean {
  const text = value.replace(/^#+\s*/, "").trim();
  if (!text || text.length > 80) return false;
  return /^(?:案例\s*[一二三四五六七八九十\d]+|[一二三四五六七八九十\d]+[、.．]\s*.+案例|【.+案例】|.+案例[:：]?)$/u.test(text);
}

/** 只有至少两个明确案例标题时才拆分；业务背景、方案、效果等普通章节属于同一案例。 */
export function splitSegments(rawText: string): RawSegment[] {
  const fullText = rawText?.trim() || "";
  if (!fullText) return [{ title: "", rawExcerpt: "" }];
  const blocks = fullText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const headingIndexes = blocks
    .map((block, index) => ({ index, firstLine: block.split(/\n/, 1)[0] || "" }))
    .filter(({ firstLine }) => isCaseHeading(firstLine));

  if (headingIndexes.length < 2) {
    return [{ title: "", locator: "main", rawExcerpt: fullText }];
  }

  return headingIndexes.map(({ index, firstLine }, headingIndex) => {
    const nextIndex = headingIndexes[headingIndex + 1]?.index ?? blocks.length;
    return {
      title: firstLine.replace(/^#+\s*/, "").replace(/[:：]$/, "").trim(),
      sectionTitle: firstLine,
      locator: `case-${headingIndex + 1}`,
      rawExcerpt: blocks.slice(index, nextIndex).join("\n\n"),
    };
  });
}

/**
 * 由原始文本生成来源片段。segmentKey 取自标题/章节或哈希。
 */
export function buildSegments(input: SegmentInput): SourceCaseSegment[] {
  const raws = splitSegments(input.rawText);
  const now = new Date().toISOString();
  return raws.map((raw, idx) => {
    const segTitle = raw.title || input.title || `片段${idx + 1}`;
    const identityText = [
      input.organizationMention,
      raw.sectionTitle || segTitle,
      raws.length > 1 ? raw.locator : "main",
    ]
      .filter(Boolean)
      .join("__");
    const segmentKey = input.externalCaseId
      ? `external:${input.externalCaseId}`
      : `case:${contentHash("", identityText).slice(0, 20)}`;
    const segmentHash = contentHash(segTitle, raw.rawExcerpt);
    const fingerprint: CaseFingerprint = buildFingerprintFromText({
      title: segTitle,
      rawText: raw.rawExcerpt,
      organizationId: input.organizationId,
      scenario: input.scenario,
      department: input.department,
      implementer: input.implementer,
      solution: input.solution,
      result: input.result,
    });
    return {
      id: `seg_${contentHash("", `${input.sourceId}__${segmentKey}`).slice(0, 24)}`,
      sourceId: input.sourceId,
      segmentKey,
      externalCaseId: input.externalCaseId,
      organizationMention: raw.organizationMention || input.organizationMention || "",
      organizationId: input.organizationId,
      title: segTitle,
      sectionTitle: raw.sectionTitle,
      locator: raw.locator,
      rawExcerpt: raw.rawExcerpt,
      segmentHash,
      fingerprint,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** 兼容旧调用点；模型抽取应先产出明确的案例数组，再逐项调用 buildSegments。 */
export async function enhanceSegmentsWithModel(segments: SourceCaseSegment[]): Promise<SourceCaseSegment[]> {
  return segments;
}

export { emptyFingerprint };
