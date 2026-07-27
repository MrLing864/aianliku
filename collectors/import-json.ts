import { readFileSync } from "fs";
import { upsertCase } from "./lib/cloudbase";

const file = process.argv.find((a) => a.startsWith("--file="))?.split("=")[1] || "collectors/tencent-cases.json";

async function main() {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const cases = raw.cases || [];
  console.log(`[import] 从 ${file} 读取到 ${cases.length} 个案例`);
  for (const c of cases) {
    try {
      const res = await upsertCase(c);
      console.log(`[import] ${res.created ? "创建" : "更新"}: ${c.organization.name} - ${c.title}`);
    } catch (err: any) {
      console.error(`[import] 失败 ${c.organization?.name}:`, err.message || err);
    }
  }
  console.log("[import] 完成");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
