// 独立验证 EdgeOne Blob 调用是否正常（set → get → delete 闭环）。
// 直接调用 @edgeone/pages-blob，不依赖 Next.js / React Server Components，
// 因此可在普通 Node 进程里运行。用法见文件底部说明。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 简易 .env.local 加载（仅补充缺失项，不覆盖已有 process.env）
function loadEnvFile(name) {
  try {
    const raw = readFileSync(join(root, name), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* 文件不存在则忽略 */
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const projectId = process.env.EO_BLOB_PROJECT_ID;
const token = process.env.EO_BLOB_TOKEN;
const storeName = process.env.EO_BLOB_STORE || "aianliku";

if (!projectId || !token) {
  console.error("✗ 缺少环境变量：请在 .env.local 中设置 EO_BLOB_PROJECT_ID 与 EO_BLOB_TOKEN");
  process.exit(2);
}

const { getStore } = await import("@edgeone/pages-blob");

async function main() {
  console.log(`→ projectId = ${projectId}`);
  console.log(`→ store     = ${storeName}`);
  const store = getStore({ name: storeName, projectId, token });

  const key = `__verify__/probe-${Date.now()}.txt`;
  const payload = "hello-edgeone-blob";

  // 1) set
  console.log(`\n[1/3] set(${key})`);
  await store.set(key, payload, { cacheControl: "no-store" });
  console.log("  ✓ 写入成功");

  // 2) get
  console.log(`[2/3] get(${key})`);
  const got = await store.get(key, { type: "text", consistency: "strong" });
  if (got !== payload) {
    throw new Error(`读取内容不匹配：期望 "${payload}"，实际 ${JSON.stringify(got)}`);
  }
  console.log(`  ✓ 读回内容一致："${got}"`);

  // 3) delete
  console.log(`[3/3] delete(${key})`);
  await store.delete(key);
  const after = await store.get(key, { type: "text", consistency: "strong" });
  if (after !== null) throw new Error("删除后对象仍然存在");
  console.log("  ✓ 删除成功（对象已不存在）");

  console.log("\n✅ EdgeOne Blob 调用正常：set / get / delete 闭环通过");
}

main().catch((err) => {
  console.error("\n✗ Blob 验证失败：");
  console.error(err?.stack || err);
  process.exit(1);
});
