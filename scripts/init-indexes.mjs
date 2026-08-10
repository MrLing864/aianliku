// 索引初始化与验证（计划六）
// 在 CloudBase 控制台配置唯一/复合索引，本脚本负责验证其存在；缺失时尝试用 node-sdk 创建，失败则打印手动创建提示。
// 用法：node scripts/init-indexes.mjs
import tcb from "@cloudbase/node-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = tcb.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});
const db = app.database();

// 期望索引：{ collection, name, keys, unique, sparse }
const EXPECTED = [
  // URL/外部编号为空时 CloudBase 的 sparse 行为不足以表达 MongoDB partialFilterExpression；
  // 唯一性由稳定 _id 保证，以下索引用于加速查找，避免空字符串互相冲突。
  { collection: "sources", name: "sources_normalizedUrlHash", keys: { normalizedUrlHash: 1 }, unique: false, sparse: true },
  { collection: "sources", name: "sources_pub_ext", keys: { publisherNormalized: 1, externalId: 1 }, unique: false, sparse: true },
  { collection: "source_case_segments", name: "seg_source_segment", keys: { sourceId: 1, segmentKey: 1 }, unique: true },
  { collection: "organization_aliases", name: "alias_norm", keys: { normalizedAlias: 1 }, unique: true, sparse: true },
  { collection: "organizations", name: "org_norm", keys: { normalizedName: 1 }, unique: false },
  { collection: "cases", name: "cases_org_status", keys: { "organization.id": 1, contentStatus: 1 }, unique: false },
  { collection: "cases", name: "cases_projSigV2", keys: { projectSignatureV2: 1 }, unique: false },
  { collection: "duplicate_candidates", name: "dc_incoming_existing_rule", keys: { incomingSegmentId: 1, existingCaseId: 1, ruleVersion: 1 }, unique: true },
  { collection: "import_rows", name: "import_rows_origin", keys: { originKey: 1 }, unique: true, sparse: true },
  { collection: "raw_import_records", name: "rir_origin", keys: { originKey: 1 }, unique: true },
  { collection: "raw_import_records", name: "rir_job_row_attempt", keys: { jobId: 1, rowNumber: 1, attempt: 1 }, unique: false, sparse: true },
];

async function listIndexes(collName) {
  try {
    // CloudBase node-sdk 支持 collection.indexes() 或 db.getCollectionIndexes
    const coll = db.collection(collName);
    if (typeof coll.indexes === "function") return await coll.indexes();
    if (typeof coll.listIndexes === "function") return await coll.listIndexes();
    return [];
  } catch {
    return [];
  }
}

async function createIndex(spec) {
  try {
    const coll = db.collection(spec.collection);
    const def = { name: spec.name, keys: spec.keys, unique: spec.unique, sparse: spec.sparse };
    if (typeof coll.createIndex === "function") {
      await coll.createIndex(def);
      return true;
    }
    // 退化到管理 API
    if (typeof db.createIndex === "function") {
      await db.createIndex({ collectionName: spec.collection, ...def });
      return true;
    }
    return false;
  } catch (e) {
    console.warn(`  创建索引 ${spec.name} 失败:`, String(e?.message || e));
    return false;
  }
}

async function main() {
  // 阶段零：确保集合存在
  const NEW_COLLECTIONS = ["organizations", "organization_aliases", "sources", "source_versions", "source_case_segments", "raw_import_records", "duplicate_candidates", "import_rows", "case_field_claims", "content_conflicts", "case_versions"];
  for (const name of NEW_COLLECTIONS) {
    try {
      await db.createCollection(name);
      console.log(`已创建集合 ${name}`);
    } catch (e) {
      const msg = String(e?.message || e);
      if (!/already exists|DUPLICATE_COLLECTION|ResourceExist/i.test(msg)) console.warn(`集合 ${name} 创建提示:`, msg);
    }
  }

  let missing = 0;
  for (const spec of EXPECTED) {
    const idxs = await listIndexes(spec.collection);
    const names = (idxs || []).map((i) => i.name || i.Name || "").filter(Boolean);
    const exists = names.includes(spec.name);
    if (exists) {
      console.log(`✓ ${spec.collection}.${spec.name} 已存在`);
    } else {
      missing++;
      console.log(`✗ ${spec.collection}.${spec.name} 缺失，尝试创建…`);
      const ok = await createIndex(spec);
      console.log(ok ? `  ✓ 已创建` : `  ! 需手动在 CloudBase 控制台创建：${JSON.stringify(spec)}`);
    }
  }
  console.log(missing === 0 ? "\n所有索引就绪。" : `\n${missing} 个索引待处理（见上）。`);
}

main().catch((e) => { console.error("索引初始化失败:", e); process.exit(1); });
