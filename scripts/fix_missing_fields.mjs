import { readFileSync } from "node:fs";
import cloudbase from "@cloudbase/node-sdk";

const envText = readFileSync(".env", "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");

// 旧前缀 -> 规范前缀 的重定向映射
function canonicalSlug(slug) {
  if (slug.startsWith("case-report-2024top30-")) {
    return "case-top30-2024-" + slug.slice("case-report-2024top30-".length);
  }
  if (slug.startsWith("case-report-kefu-top10-2024-")) {
    return "case-kefu-2024-" + slug.slice("case-report-kefu-top10-2024-".length);
  }
  return null;
}

const isArr = (v) => Array.isArray(v);
let scanned = 0;
let fixed = 0;
let redirected = 0;
let skip = 0;

// 全量分页拉取，逐一检查
let offset = 0;
const PAGE = 100;
while (true) {
  const res = await coll
    .where({ contentStatus: "published" })
    .skip(offset)
    .limit(PAGE)
    .field({
      slug: true,
      summary: true,
      results: true,
      implementationSteps: true,
      painPointTags: true,
      editorComment: true,
    })
    .get();
  const docs = (res && res.data) || [];
  if (docs.length === 0) break;
  for (const c of docs) {
    scanned++;
    const target = canonicalSlug(c.slug);
    const missing = !isArr(c.results) || !isArr(c.implementationSteps) || !isArr(c.painPointTags) || !c.editorComment;
    if (!missing && !target) {
      skip++;
      continue;
    }
    if (target) {
      // 重复旧 slug：转为 merged 重定向到规范页，并补缺失字段（防御直接访问）
      const patch = {
        contentStatus: "merged",
        mergedIntoSlug: target,
        results: isArr(c.results) ? c.results : [],
        implementationSteps: isArr(c.implementationSteps) ? c.implementationSteps : [],
        painPointTags: isArr(c.painPointTags) ? c.painPointTags : [],
        editorComment:
          c.editorComment && typeof c.editorComment.text === "string"
            ? c.editorComment
            : { text: "", suitableFor: "", prerequisites: "" },
      };
      const r = await coll.where({ slug: c.slug }).update(patch);
      redirected++;
      if (r && (r.updated ?? 0) > 0) fixed++;
    } else if (missing) {
      // 非重复但缺字段：补默认值（editorComment 用 summary 生成一句话点评）
      const text = c.summary && c.summary.trim() ? c.summary.trim().slice(0, 120) : "该案例来源于公开行业报告，内容已结构化整理。";
      const patch = {
        results: isArr(c.results) ? c.results : [],
        implementationSteps: isArr(c.implementationSteps) ? c.implementationSteps : [],
        painPointTags: isArr(c.painPointTags) ? c.painPointTags : [],
        editorComment:
          c.editorComment && typeof c.editorComment.text === "string"
            ? c.editorComment
            : { text, suitableFor: "关注该 AI 应用场景的企业", prerequisites: "具备相应的数据与系统基础" },
      };
      const r = await coll.where({ slug: c.slug }).update(patch);
      fixed++;
      if (r && (r.updated ?? 0) > 0) fixed++;
    }
  }
  if (docs.length < PAGE) break;
  offset += PAGE;
}

console.log(JSON.stringify({ scanned, skip, fixed, redirected }, null, 2));
