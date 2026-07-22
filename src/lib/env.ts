import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.url().optional(),
);

const schema = z.object({
  CLOUDBASE_ENV: z.string().min(1).optional(),
  CLOUDBASE_SECRET_ID: z.string().min(1).optional(),
  CLOUDBASE_SECRET_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD_HASH: z.string().min(20).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().default("deepseek-v4-pro"),
  AI_FAST_MODEL: z.string().default("deepseek-v4-flash"),
  COS_SECRET_ID: z.string().optional(),
  COS_SECRET_KEY: z.string().optional(),
  COS_BUCKET: z.string().optional(),
  COS_REGION: z.string().optional(),
  OPS_ALERT_WEBHOOK_URL: optionalUrl,
  OPS_ALERT_BEARER_TOKEN: z.string().optional(),
});

// 保底密钥：仅在部署环境未注入 AUTH_SECRET 时启用，避免 Auth.js 抛 MissingSecret
// 导致管理后台整页 500。生产环境务必通过环境变量设置真实随机密钥。
const FALLBACK_AUTH_SECRET = "aianliku-prod-fallback-secret-9f3c2b7e1d8a4650-change-me";
const resolvedAuthSecret = process.env.AUTH_SECRET?.trim() || FALLBACK_AUTH_SECRET;
if (!process.env.AUTH_SECRET?.trim()) {
  console.warn(
    "[env] AUTH_SECRET 未设置，已使用保底密钥。管理后台可访问，但会话安全性降低，请在部署平台配置真实 AUTH_SECRET。",
  );
}

export const env = schema.parse({
  CLOUDBASE_ENV: process.env.CLOUDBASE_ENV,
  CLOUDBASE_SECRET_ID: process.env.CLOUDBASE_SECRET_ID,
  CLOUDBASE_SECRET_KEY: process.env.CLOUDBASE_SECRET_KEY,
  AUTH_SECRET: resolvedAuthSecret,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  AI_FAST_MODEL: process.env.AI_FAST_MODEL,
  COS_SECRET_ID: process.env.COS_SECRET_ID,
  COS_SECRET_KEY: process.env.COS_SECRET_KEY,
  COS_BUCKET: process.env.COS_BUCKET,
  COS_REGION: process.env.COS_REGION,
  OPS_ALERT_WEBHOOK_URL: process.env.OPS_ALERT_WEBHOOK_URL,
  OPS_ALERT_BEARER_TOKEN: process.env.OPS_ALERT_BEARER_TOKEN,
});

export const hasDb = Boolean(
  env.CLOUDBASE_ENV && env.CLOUDBASE_SECRET_ID && env.CLOUDBASE_SECRET_KEY,
);
export const hasAI = Boolean(env.DEEPSEEK_API_KEY);
export const hasCos = Boolean(
  env.COS_SECRET_ID &&
  env.COS_SECRET_KEY &&
  env.COS_BUCKET &&
  env.COS_REGION,
);
export const hasOpsAlerts = Boolean(env.OPS_ALERT_WEBHOOK_URL);
