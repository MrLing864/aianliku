import { listCases, getCaseBySlug } from "@/lib/repositories/cases";

async function main() {
  console.log("== listCases(default) ==");
  try {
    const r = await listCases({ page: 1, limit: 12 });
    console.log("OK total=", r.total, "items=", r.items.length, "mode=", r.mode);
    if (r.items[0]) console.log("first=", r.items[0].title);
  } catch (e) {
    console.error("FAIL listCases:", e && (e as Error).message);
    console.error((e as Error).stack);
  }
}

main().then(() => process.exit(0));
