import { config } from "dotenv";

async function main() {
  config({ path: ".env.local", quiet: true });
  const [{ getDb, ensureIndexes, isDbConfigured }] = await Promise.all([
    import("../src/lib/db/cloudbase"),
  ]);
  if (!isDbConfigured())
    throw new Error(
      "CLOUDBASE_ENV / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY 未在 .env.local 配置",
    );
  await ensureIndexes();
  const db = await getDb();
  await db.command({ ping: 1 });
  console.log(
    "CloudBase 连接正常。CloudBase 文档数据库索引需在控制台手动管理（ensureIndexes 为 no-op）。",
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
