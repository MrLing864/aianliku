// 历史数据迁移（计划七 阶段二~五）
// 只读安全：默认 dry-run，打印将执行的操作；加 --apply 才真正写入。
// 阶段二：从现有 cases 生成企业主体(organizations) + 回填 cases.organization.id；cases.sources 回填到 sources 集合；单案例来源建 segment。
// 阶段三：为所有未删除 cases 生成 V2 项目指纹（fingerprintVersion=dedup-v2），不改公开正文。
// 阶段四：历史重复扫描（仅同企业内）：生成 duplicate_candidates（status=pending），不自动合并。
// 阶段五：灰度检查 DEDUP_V2_MODE（observe/enforce），仅打印当前模式。
import "dotenv/config";
import tcb from "@cloudbase/node-sdk";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { generateFingerprintFromText } from "./_migrate_helpers.mjs";

const APPLY = process.argv.includes("--apply");
console.log(APPLY ? "【执行模式】将写入数据库" : "【预演模式】仅打印，加 --apply 才写入");

if (!isDbConfigured()) { console.error("数据库未配置"); process.exit(1); }
const db = await getDb();
const nativeDb = tcb.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
}).database();

function normName(name) {
  return (name || "").toLowerCase().replace(/\s+/g, "").replace(/[^\w\u4e00-\u9fa5]/g, "").replace(/(股份有限公司|有限公司|有限责任公司|集团|控股|技术|科技|股份|有限|公司|corp|inc|llc|ltd|co)$/gi, "").trim();
}
function normUrl(u) {
  if (!u) return "";
  try { const x = new URL(u); return `${x.hostname.replace(/^www\./, "").toLowerCase()}${x.pathname.replace(/\/+$/, "") || "/"}`; }
  catch { return u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, ""); }
}
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
function logicalCaseId(c) { return String(c.id || c._id || ""); }

async function getAll(collName, projection) {
  const coll = db.collection(collName);
  const out = [];
  const total = await coll.countDocuments({});
  const PAGE = 1000;
  for (let i = 0; i < total; i += PAGE) {
    const res = await coll.find({}).project(projection).skip(i).limit(PAGE).toArray();
    out.push(...res);
  }
  return out;
}

// 确保某来源存在 main segment（幂等：已存在则跳过）
async function ensureSegment(srcId, c, orgId, orgName, hash, onCreated) {
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
    onCreated();
  } catch (segErr) {
    if (!String(segErr?.message || segErr).includes("duplicate")) console.warn("  segment 写入异常:", String(segErr?.message || segErr));
  }
}

async function main() {
  // 阶段零：确保所有新集合存在（CloudBase 需先建集合才能写入）
  const NEW_COLLECTIONS = ["organizations", "organization_aliases", "sources", "source_versions", "source_case_segments", "raw_import_records", "duplicate_candidates", "case_field_claims", "content_conflicts", "case_versions"];
  if (APPLY) {
    for (const name of NEW_COLLECTIONS) {
      try {
        await nativeDb.createCollection(name);
        console.log(`  已创建集合 ${name}`);
      } catch (e) {
        const msg = String(e?.message || e);
        if (!/already exists|DUPLICATE_COLLECTION|ResourceExist/i.test(msg)) console.warn(`  集合 ${name} 创建提示:`, msg);
      }
    }
  }

  // 阶段五：灰度检查
  const mode = (process.env.DEDUP_V2_MODE === "enforce") ? "enforce" : "observe";
  console.log(`阶段五：DEDUP_V2_MODE = ${mode}`);

  // 阶段二：主体 + 来源 + 片段
  const cases = await getAll("cases", { _id: true, id: true, title: true, organization: true, sources: true, summary: true, solution: true, resultText: true, results: true, scenarios: true, businessFunctions: true, contentStatus: true, mergedIntoCaseId: true });
  const liveCases = cases.filter((c) => c.contentStatus !== "deleted" && !c.mergedIntoCaseId);
  console.log(`阶段二：处理 ${liveCases.length} 条有效案例`);

  const orgByName = new Map();
  let orgCreated = 0, sourceCreated = 0, segmentCreated = 0, caseOrgBackfilled = 0;

  for (const c of liveCases) {
    const orgName = c.organization?.name || c.organization?.canonicalName;
    const n = normName(orgName);
    let orgId = c.organization?.id;
    if (n && !orgId) {
      // 用 findOne 查重（跨运行幂等），不依赖内存 map
      const existingOrg = await db.collection("organizations").findOne({ normalizedName: n });
      if (existingOrg) {
        orgId = existingOrg._id || existingOrg.id;
      } else {
        orgCreated++;
        if (APPLY) {
          const inserted = await db.collection("organizations").insertOne({
            canonicalName: orgName, normalizedName: n, englishNames: [], historicalNames: [],
            externalIds: {}, status: "pending_review", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1,
          });
          orgId = inserted.insertedId;
          await db.collection("organization_aliases").insertOne({ organizationId: orgId, alias: orgName, normalizedAlias: n, aliasType: "人工纠错", confidence: 1, status: "active" });
        }
      }
      caseOrgBackfilled++;
      if (APPLY && orgId) await db.collection("cases").updateOne({ _id: c._id }, { $set: { "organization.id": orgId } });
      if (orgId) c.organization = { ...(c.organization || {}), id: orgId };
    }

    // sources 回填（带唯一索引冲突容错，幂等可重跑）
    // 注意：真实库 sources 集合唯一索引为 source_url_unique（基于 normalizedUrl 字符串），故查询/写入均以 normalizedUrl 为准。
    const srcList = Array.isArray(c.sources) ? c.sources : [];
    for (const s of srcList) {
      const url = normUrl(s.url);
      const hash = fnv(url);
      if (!url) continue;
      let srcId;
      const existing = await db.collection("sources").findOne({ normalizedUrl: url });
      if (existing) {
        srcId = existing._id || existing.id;
        if (APPLY) {
          const ids = Array.from(new Set([...(existing.caseIds || []), logicalCaseId(c)]));
          await db.collection("sources").updateOne({ _id: srcId }, { $set: { caseIds: ids } });
        }
        if (APPLY) await ensureSegment(srcId, c, orgId, orgName, hash, () => segmentCreated++);
        continue;
      }
      sourceCreated++;
      if (!APPLY) continue;
      try {
        const inserted = await db.collection("sources").insertOne({
          originalUrl: s.url, normalizedUrl: url, normalizedUrlHash: hash,
          publisher: s.publisher || "", publisherNormalized: normName(s.publisher), externalId: s.externalId || "",
          type: s.type || "web", title: c.title, publishedAt: s.publishedAt || c.publishedAt || "",
          contentHash: fnv(`${c.title}__${(c.summary || "").slice(0, 500)}`), lastCollectedAt: new Date().toISOString(),
          caseIds: [logicalCaseId(c)], contentVersion: 1, accessibility: "available", supports: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        srcId = inserted.insertedId;
        await ensureSegment(srcId, c, orgId, orgName, hash, () => segmentCreated++);
      } catch (srcErr) {
        if (String(srcErr?.message || srcErr).includes("duplicate")) {
          const again = await db.collection("sources").findOne({ normalizedUrl: url });
          if (again) {
            srcId = again._id || again.id;
            const ids = Array.from(new Set([...(again.caseIds || []), logicalCaseId(c)]));
            await db.collection("sources").updateOne({ _id: srcId }, { $set: { caseIds: ids } });
            await ensureSegment(srcId, c, orgId, orgName, hash, () => segmentCreated++);
          }
        } else {
          console.warn("  source 写入异常:", String(srcErr?.message || srcErr));
        }
      }
    }
  }
  console.log(`  主体新建 ${orgCreated}，cases.organization.id 回填 ${caseOrgBackfilled}，来源新建 ${sourceCreated}，片段新建 ${segmentCreated}`);

  // 阶段三：V2 指纹（不修改公开正文）
  let fpWritten = 0;
  for (const c of liveCases) {
    const orgId = c.organization?.id;
    const fp = generateFingerprintFromText({ title: c.title, rawText: [c.summary, c.solution, c.resultText, c.results].filter(Boolean).join(" "), scenarios: c.scenarios, businessFunctions: c.businessFunctions, organizationId: orgId });
    fpWritten++;
    if (APPLY) await db.collection("cases").updateOne({ _id: c._id }, { $set: { projectSignatureV2: JSON.stringify(fp), fingerprintVersion: "dedup-v2" } });
  }
  console.log(`阶段三：V2 指纹写入 ${fpWritten}`);

  // 阶段四：历史重复扫描（仅同企业内，生成候选不合并）
  let candidateCreated = 0;
  const byOrg = new Map();
  for (const c of liveCases) {
    const oid = c.organization?.id;
    if (!oid) continue;
    if (!byOrg.has(oid)) byOrg.set(oid, []);
    byOrg.get(oid).push(c);
  }
  const scenarioSlug = (c) => {
    const sc = c.scenarios;
    if (Array.isArray(sc) && sc.length) {
      const f = sc[0];
      return typeof f === "string" ? f : (f.slug || f.name);
    }
    return undefined;
  };
  for (const [oid, group] of byOrg) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        // 同场景、标题不同、或关键指标一致 → 疑似重复候选
        const sameScenario = scenarioSlug(a) && scenarioSlug(a) === scenarioSlug(b);
        const diffTitle = normName(a.title) !== normName(b.title);
        const metricsA = (a.results || a.resultText || "").match(/\d+(\.\d+)?\s?(%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加)/g) || [];
        const metricsB = (b.results || b.resultText || "").match(/\d+(\.\d+)?\s?(%|％|倍|个|万元|亿元|万|亿|小时|天|月|人|次|项|提升|降低|减少|增加)/g) || [];
        const metricOverlap = metricsA.filter((m) => metricsB.includes(m)).length;
        if ((sameScenario && diffTitle) || metricOverlap >= 2) {
          candidateCreated++;
          if (APPLY) {
            try {
              const candidateId = `dc_${fnv(`${logicalCaseId(b)}__${logicalCaseId(a)}__dedup-v2.0.0-migrate`)}`;
              await db.collection("duplicate_candidates").insertOne({
                id: candidateId, incomingSegmentId: `migration_case:${logicalCaseId(b)}`,
                incomingTitle: b.title, incomingOrganization: b.organization?.name || "", existingCaseId: logicalCaseId(a), existingCaseTitle: a.title,
                ruleScore: 0.7, modelScore: 0, verificationScore: 0, overallScore: 0.7,
                relationship: "insufficient_evidence", matchedFacts: [], conflictingFacts: [], missingFacts: [], evidenceRefs: [],
                recommendedAction: "defer", ruleVersion: "dedup-v2.0.0-migrate", status: "pending", createdAt: new Date().toISOString(),
              });
            } catch (dcErr) {
              // 唯一索引冲突视为已存在，忽略
              if (!String(dcErr?.message || dcErr).includes("duplicate")) console.warn("  candidate 写入异常:", String(dcErr?.message || dcErr));
            }
          }
        }
      }
    }
  }
  console.log(`阶段四：历史重复候选生成 ${candidateCreated}（仅标记，不合并）`);
  console.log(APPLY ? "\n迁移执行完成。" : "\n预演完成，加 --apply 执行实际写入。");
}

main().catch((e) => { console.error("迁移失败:", e); process.exit(1); });
