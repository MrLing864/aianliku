// 检查 scripts/extracted/*.json 中的新案例是否已存在于 CloudBase cases 集合（按企业名/标题去重）。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
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

const EXT_DIR = join(process.cwd(), "scripts", "extracted");
const files = readdirSync(EXT_DIR).filter((f) => f.endsWith(".json"));
let all = [];
for (const f of files) {
  const arr = JSON.parse(readFileSync(join(EXT_DIR, f), "utf-8"));
  all = all.concat(arr.map((c) => ({ ...c, _file: f })));
}
console.log(`[dup] 待检查新案例 ${all.length} 条，来自 ${files.length} 个文件`);

// 拉取现有案例的 title + organization.name
const existing = await coll.field({ title: true, organization: true }).limit(1000).get();
const exDocs = existing.data || [];
console.log(`[dup] 云端现有案例 ${exDocs.length} 条`);

function norm(s) {
  return (s || "").replace(/[有限公司公司集团股份（(）)]/g, "").trim();
}
const exNorm = exDocs.map((d) => ({
  title: d.title,
  org: (d.organization && d.organization.name) || "",
  norg: norm(d.organization && d.organization.name),
  ntitle: norm(d.title),
}));

let dup = 0;
let fresh = 0;
for (const c of all) {
  const norg = norm(c.enterprise);
  const ntitle = norm(c.title);
  const hits = exNorm.filter(
    (e) =>
      (norg && e.norg && (e.norg.includes(norg) || norg.includes(e.norg))) ||
      (ntitle && e.ntitle && (e.ntitle.includes(ntitle) || ntitle.includes(e.ntitle)))
  );
  if (hits.length) {
    dup += 1;
    console.log(`DUP  ${c.enterprise} | ${c.title}  => 命中: ${hits.map((h) => h.org + "/" + h.title).join(" ; ")}`);
  } else {
    fresh += 1;
    console.log(`NEW  ${c.enterprise} | ${c.title}`);
  }
}
console.log(`[dup] 结果：新增 ${fresh} 条，重复 ${dup} 条`);
