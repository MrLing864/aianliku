import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["collectors/**/*.ts"],
    rules: {
      // 采集器需要适配多个不稳定的第三方页面/JSON 形状，边界处允许显式 any；
      // 入库前仍由 Zod 和统一去重接入层校验。
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    "node_modules_node16_bak/**",
    ".next/**",
    ".next-stale-*/**",
    ".next-broken-*/**",
    ".dependency-stale-*/**",
    "out/**",
    "build/**",
    ".edgeone/**",
    ".codebuddy/**",
    "src/app/.well-known/**",
    "public/.well-known/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
