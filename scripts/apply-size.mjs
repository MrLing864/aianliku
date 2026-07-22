import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Map of organization name -> size band. Loaded from org-size-map.json.
const mapFile = join(process.cwd(), "scripts", "org-size-map.json");
let map = {};
try {
  map = JSON.parse(readFileSync(mapFile, "utf8"));
} catch {
  console.error("No org-size-map.json found. Run research first.");
  process.exit(1);
}

const VALID = new Set(["1–20人", "21–50人", "51–100人", "101–500人", "501–1000人", "1000人以上", "未披露"]);
const dir = join(process.cwd(), "cases_json");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let updated = 0;
let notFound = 0;
const missing = [];

for (const f of files) {
  const p = join(dir, f);
  const data = JSON.parse(readFileSync(p, "utf8"));
  const orgName = data.organization?.name;
  if (!orgName) continue;
  const band = map[orgName];
  if (!band) {
    notFound++;
    missing.push(orgName);
    continue;
  }
  if (!VALID.has(band)) {
    console.warn(`WARN: invalid band "${band}" for ${orgName}; skipping`);
    notFound++;
    missing.push(orgName + " (invalid band)");
    continue;
  }
  if (data.organization.size !== band) {
    data.organization.size = band;
    writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
    updated++;
  }
}

console.log(`Updated ${updated} case files.`);
console.log(`Orgs not in map: ${notFound}`);
if (missing.length) {
  writeFileSync(join(process.cwd(), "scripts", "missing-orgs.json"), JSON.stringify(missing, null, 2), "utf8");
  console.log("Missing orgs written to scripts/missing-orgs.json");
}
