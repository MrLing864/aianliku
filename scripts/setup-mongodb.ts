import { config } from "dotenv";

async function main() {
  config({ path: ".env.local", quiet: true });
  const [{ getDb, ensureIndexes, isMongoConfigured }, { DEDUP_VECTOR_DIMENSIONS }] = await Promise.all([import("../src/lib/db/mongodb"), import("../src/lib/dedup")]);
  if (!isMongoConfigured()) throw new Error("MONGODB_URI is not configured in .env.local");
  await ensureIndexes();
  const db = await getDb();
  const cases = db.collection("cases");
  const existing = new Set((await cases.listSearchIndexes().toArray()).map((index) => index.name));
  const created: string[] = [];
  if (!existing.has("case_search")) {
    created.push(await cases.createSearchIndex({
      name: "case_search",
      type: "search",
      definition: { analyzer: "lucene.smartcn", searchAnalyzer: "lucene.smartcn", mappings: { dynamic: true } },
    }));
  }
  if (!existing.has("case_dedup_vector")) {
    created.push(await cases.createSearchIndex({
      name: "case_dedup_vector",
      type: "vectorSearch",
      definition: { fields: [{ type: "vector", path: "dedupVector", numDimensions: DEDUP_VECTOR_DIMENSIONS, similarity: "cosine" }, { type: "filter", path: "contentStatus" }] },
    }));
  }
  console.log(created.length ? `Requested Atlas indexes: ${created.join(", ")}` : "Atlas Search and Vector Search indexes already exist.");
  console.log("Index creation is asynchronous. Check Atlas or listSearchIndexes() until status is READY before launch verification.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
