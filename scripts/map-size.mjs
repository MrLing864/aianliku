import { readFileSync } from "node:fs";
import { join } from "node:path";

const top = JSON.parse(readFileSync(join(process.cwd(), "scripts/extracted/top30.json"), "utf-8"));
const map = JSON.parse(readFileSync(join(process.cwd(), "scripts/org-size-map.json"), "utf-8"));

function norm(s) {
  return (s || "").replace(/[（）()\s]/g, "").replace(/[有限股份集团公司中心院大学研究所有]/g, "").trim();
}
const keys = Object.keys(map);
const keyNorm = keys.map((k) => ({ k, n: norm(k) }));

const missing = [];
for (const c of top) {
  const n = norm(c.enterprise);
  let hit = keyNorm.find((x) => x.n && (x.n === n || x.n.includes(n) || n.includes(x.n)));
  if (hit) {
    console.log(`HIT  ${c.enterprise} -> ${map[hit.k]}  (matched ${hit.k})`);
  } else {
    console.log(`MISS ${c.enterprise}`);
    missing.push(c.enterprise);
  }
}
console.log("\n需要联网查询 size 的企业:", JSON.stringify(missing, null, 0));
