import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "cases_json");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const rows = [];
const orgMap = new Map(); // orgName -> { size, cases: [] }
const implMap = new Map(); // implName -> roles

for (const f of files) {
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const org = data.organization || {};
  const orgName = org.name || "";
  const orgSize = org.size || "";
  const implementers = (data.implementers || []).map((i) => ({ name: i.name, role: i.role }));
  rows.push({
    caseId: data.id,
    title: data.title,
    orgName,
    orgSize,
    implementers,
  });
  if (orgName) {
    if (!orgMap.has(orgName)) orgMap.set(orgName, { size: orgSize, count: 0, cases: [] });
    const e = orgMap.get(orgName);
    e.count++;
    e.cases.push(data.id);
  }
  for (const im of implementers) {
    if (!implMap.has(im.name)) implMap.set(im.name, new Set());
    implMap.get(im.name).add(im.role);
  }
}

// Build unique org list with their implementers
const uniqueOrgs = [...orgMap.entries()].map(([name, v]) => ({ name, size: v.size, caseCount: v.count, cases: v.cases }));
const uniqueImpls = [...implMap.entries()].map(([name, roles]) => ({ name, roles: [...roles] }));

writeFileSync(
  join(process.cwd(), "scripts/orgs-extracted.json"),
  JSON.stringify({ totalCases: files.length, uniqueOrgCount: uniqueOrgs.length, uniqueImplCount: uniqueImpls.length, orgs: uniqueOrgs, implementers: uniqueImpls }, null, 2),
  "utf8"
);

console.log("Total cases:", files.length);
console.log("Unique organizations:", uniqueOrgs.length);
console.log("Unique implementers:", uniqueImpls.length);
console.log("Orgs with non-'未披露' size:", uniqueOrgs.filter((o) => o.size && o.size !== "未披露").length);
console.log("\n--- Organizations (name | size | caseCount) ---");
for (const o of uniqueOrgs) console.log(`${o.name}\t${o.size}\t${o.caseCount}`);
