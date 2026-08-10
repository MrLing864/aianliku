/* eslint-disable @typescript-eslint/no-explicit-any -- migration reads heterogeneous historical documents */
/**
 * 历史数据迁移（计划七 阶段二~五）
 * 在网站运行时环境执行（FacadeDb 数据层已验证可用），由 /api/admin/migrate-dedup-v2 触发。
 *
 * 阶段二：从现有 cases 生成企业主体(organizations) + 回填 cases.organization.id；cases.sources 回填到 sources 集合；单案例来源建 segment。
 * 阶段三：为所有未删除 cases 生成 V2 项目指纹（fingerprintVersion=dedup-v2），不改公开正文。
 * 阶段四：历史重复扫描（仅同企业内）：生成 duplicate_candidates（status=pending），不自动合并。
 * 阶段五：灰度检查 DEDUP_V2_MODE（observe/enforce），仅打印当前模式。
 */
import "server-only";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { generateFingerprintFromText } from "./_migrate_helpers";

function normName(name?: string): string {
  return (name || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "").trim();
}
function normUrl(u?: string): string {
  if (!u) return "";
  try { const x = new URL(u); return `${x.hostname.replace(/^www\./, "").toLowerCase()}${x.pathname.replace(/\/+$/, "") || "/"}`; }
  catch { return u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, ""); }
}
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
function logicalCaseId(c: any): string {
  return String(c.id || c._id || "");
}
/** 安全字符串化：results/resultText 在部分案例里可能是数组或对象，避免 .match/.join 抛错 */
function str(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(str).join(" ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export interface MigrationReport {
  mode: string;
  cases: number;
  orgCreated: number;
  caseOrgBackfilled: number;
  sourceCreated: number;
  segmentCreated: number;
  fingerprintWritten: number;
  candidateCreated: number;
  errors: string[];
}

export async function runMigration(apply: boolean): Promise<MigrationReport> {
  const report: MigrationReport = {
    mode: process.env.DEDUP_V2_MODE === "enforce" ? "enforce" : "observe",
    cases: 0, orgCreated: 0, caseOrgBackfilled: 0, sourceCreated: 0,
    segmentCreated: 0, fingerprintWritten: 0, candidateCreated: 0, errors: [],
  };
  if (!isDbConfigured()) { report.errors.push("db_unavailable"); return report; }
  const db = await getDb();
  const log = (m: string) => console.log(`[migrate] ${m}`);

  const casesColl = db.collection("cases");
  const total = await casesColl.countDocuments({});
  const liveCases: any[] = [];
  const PAGE = 200;
  for (let i = 0; i < total; i += PAGE) {
    const rows = await casesColl.find({}).project({ _id: 1, id: 1, title: 1, organization: 1, sources: 1, summary: 1, solution: 1, resultText: 1, results: 1, scenarios: 1, businessFunctions: 1, contentStatus: 1, mergedIntoCaseId: 1 }).skip(i).limit(PAGE).toArray();
    liveCases.push(...rows.filter((c: any) => c.contentStatus !== "deleted" && !c.mergedIntoCaseId));
  }
  report.cases = liveCases.length;
  log(`阶段二：处理 ${liveCases.length} 条有效案例`);

  for (const c of liveCases) {
    const orgName = c.organization?.name || c.organization?.canonicalName;
    const n = normName(orgName);
    let orgId: string | undefined = c.organization?.id;
    if (n && !orgId) {
      const existingOrg = await db.collection("organizations").findOne({ normalizedName: n });
      if (existingOrg) {
        orgId = (existingOrg as any)._id || (existingOrg as any).id;
      } else {
        report.orgCreated++;
        if (apply) {
          const ins = await db.collection("organizations").insertOne({
            canonicalName: orgName, normalizedName: n, englishNames: [], historicalNames: [],
            externalIds: {}, status: "pending_review", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1,
          });
          orgId = ins.insertedId;
          await db.collection("organization_aliases").insertOne({ organizationId: orgId, alias: orgName, normalizedAlias: n, aliasType: "人工纠错", confidence: 1, status: "active" });
        }
      }
      report.caseOrgBackfilled++;
      if (apply && orgId) await db.collection("cases").updateOne({ _id: c._id }, { $set: { "organization.id": orgId } });
      if (orgId) c.organization = { ...(c.organization || {}), id: orgId };
    }

    // sources 回填
    const srcList: any[] = Array.isArray(c.sources) ? c.sources : [];
    for (const s of srcList) {
      const url = normUrl(s.url);
      const hash = fnv(url);
      if (!url) continue;
      let srcId: string | undefined;
      const existing = await db.collection("sources").findOne({ normalizedUrl: url });
      if (existing) {
        srcId = (existing as any)._id || (existing as any).id;
        if (apply) {
          const ids = Array.from(new Set([...(existing as any).caseIds || [], logicalCaseId(c)]));
          await db.collection("sources").updateOne({ _id: srcId }, { $set: { caseIds: ids } });
          await ensureSegment(db, srcId, c, orgId, orgName, hash, report);
        }
        continue;
      }
      report.sourceCreated++;
      if (!apply) continue;
      try {
        const ins = await db.collection("sources").insertOne({
          originalUrl: s.url, normalizedUrl: url, normalizedUrlHash: hash,
          publisher: s.publisher || "", publisherNormalized: normName(s.publisher), externalId: s.externalId || "",
          type: s.type || "web", title: c.title, publishedAt: s.publishedAt || c.publishedAt || "",
          contentHash: fnv(`${c.title}__${(c.summary || "").slice(0, 500)}`), lastCollectedAt: new Date().toISOString(),
          caseIds: [logicalCaseId(c)], contentVersion: 1, accessibility: "available", supports: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        srcId = ins.insertedId;
        await ensureSegment(db, srcId, c, orgId, orgName, hash, report);
      } catch (e: any) {
        if (String(e?.message || e).includes("duplicate")) {
          const again = await db.collection("sources").findOne({ normalizedUrl: url });
          if (again) {
            srcId = (again as any)._id || (again as any).id;
            const ids = Array.from(new Set([...(again as any).caseIds || [], logicalCaseId(c)]));
            await db.collection("sources").updateOne({ _id: srcId }, { $set: { caseIds: ids } });
            await ensureSegment(db, srcId, c, orgId, orgName, hash, report);
          }
        } else report.errors.push(`source: ${String(e?.message || e).slice(0, 80)}`);
      }
    }
  }
  log(`  主体新建 ${report.orgCreated}，cases.organization.id 回填 ${report.caseOrgBackfilled}，来源新建 ${report.sourceCreated}，片段新建 ${report.segmentCreated}`);

  // 阶段三：V2 指纹
  for (const c of liveCases) {
    const orgId = c.organization?.id;
    const fp = generateFingerprintFromText({ title: c.title, rawText: [c.summary, c.solution, str(c.resultText), str(c.results)].filter(Boolean).join(" "), scenarios: c.scenarios, businessFunctions: c.businessFunctions, organizationId: orgId });
    report.fingerprintWritten++;
    if (apply) await db.collection("cases").updateOne({ _id: c._id }, { $set: { projectSignatureV2: JSON.stringify(fp), fingerprintVersion: "dedup-v2" } });
  }
  log(`阶段三：V2 指纹写入 ${report.fingerprintWritten}`);

  // 阶段四：历史重复扫描（仅同企业内，生成候选不合并）
  const byOrg = new Map<string, any[]>();
  for (const c of liveCases) {
    const oid = c.organization?.id;
    if (!oid) continue;
    if (!byOrg.has(oid)) byOrg.set(oid, []);
    byOrg.get(oid)!.push(c);
  }
  const scenarioSlug = (cc: any) => {
    const sc = cc.scenarios;
    if (Array.isArray(sc) && sc.length) { const f = sc[0]; return typeof f === "string" ? f : (f?.slug || f?.name); }
    return undefined;
  };
  for (const [, group] of byOrg) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        const sameScenario = scenarioSlug(a) && scenarioSlug(a) === scenarioSlug(b);
        const diffTitle = normName(a.title) !== normName(b.title);
        const mA: string[] = str(a.results || a.resultText).match(/\d+(\.\d+)?\s?(%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加)/g) || [];
        const mB: string[] = str(b.results || b.resultText).match(/\d+(\.\d+)?\s?(%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加)/g) || [];
        const metricOverlap = mA.filter((m: string) => mB.includes(m)).length;
        if ((sameScenario && diffTitle) || metricOverlap >= 2) {
          report.candidateCreated++;
          if (apply) {
            try {
              const candidateId = `dc_${fnv(`${logicalCaseId(b)}__${logicalCaseId(a)}__dedup-v2.0.0-migrate`)}`;
              await db.collection("duplicate_candidates").insertOne({
                id: candidateId, incomingSegmentId: `migration_case:${logicalCaseId(b)}`,
                incomingTitle: b.title, incomingOrganization: b.organization?.name || "", existingCaseId: logicalCaseId(a), existingCaseTitle: a.title,
                ruleScore: 0.7, modelScore: 0, verificationScore: 0, overallScore: 0.7,
                relationship: "insufficient_evidence", matchedFacts: [], conflictingFacts: [], missingFacts: [], evidenceRefs: [],
                recommendedAction: "defer", ruleVersion: "dedup-v2.0.0-migrate", status: "pending", createdAt: new Date().toISOString(),
              });
            } catch (e: any) {
              if (!String(e?.message || e).includes("duplicate")) report.errors.push(`candidate: ${String(e?.message || e).slice(0, 80)}`);
            }
          }
        }
      }
    }
  }
  log(`阶段四：历史重复候选生成 ${report.candidateCreated}（仅标记，不合并）`);
  log(apply ? "迁移执行完成。" : "预演完成（加 apply 参数实际执行）。");
  return report;
}

async function ensureSegment(db: any, srcId: string | undefined, c: any, orgId: string | undefined, orgName: string | undefined, hash: string, report: MigrationReport) {
  const segKey = "main";
  const existing = await db.collection("source_case_segments").findOne({ sourceId: srcId, segmentKey: segKey });
  if (existing) return;
  try {
    await db.collection("source_case_segments").insertOne({
      sourceId: srcId, segmentKey: segKey, organizationMention: orgName || "", organizationId: orgId,
      title: c.title, rawExcerpt: c.summary || c.solution || "", segmentHash: fnv(`${c.title}__${(c.summary || "").slice(0, 300)}`),
      fingerprint: generateFingerprintFromText({ title: c.title, rawText: [c.summary, c.solution, c.resultText, c.results].filter(Boolean).join(" "), scenarios: c.scenarios, businessFunctions: c.businessFunctions, organizationId: orgId }),
      caseId: logicalCaseId(c), status: "linked", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    report.segmentCreated++;
  } catch (e: any) {
    if (!String(e?.message || e).includes("duplicate")) report.errors.push(`segment: ${String(e?.message || e).slice(0, 80)}`);
  }
}
