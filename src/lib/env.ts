import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.url().optional(),
);

const schema = z.object({
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().min(1).default("aianliku"),
  AUTH_SECRET: z.string().min(16).optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD_HASH: z.string().min(20).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default("AI案例库 <onboarding@resend.dev>"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().default("deepseek-v4-pro"),
  AI_FAST_MODEL: z.string().default("deepseek-v4-flash"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("aianliku-private"),
  OPS_ALERT_WEBHOOK_URL: optionalUrl,
  OPS_ALERT_BEARER_TOKEN: z.string().optional(),
});

export const env = schema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  AI_FAST_MODEL: process.env.AI_FAST_MODEL,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  OPS_ALERT_WEBHOOK_URL: process.env.OPS_ALERT_WEBHOOK_URL,
  OPS_ALERT_BEARER_TOKEN: process.env.OPS_ALERT_BEARER_TOKEN,
});

export const hasMongo = Boolean(env.MONGODB_URI);
export const hasEmail = Boolean(env.RESEND_API_KEY);
export const hasAI = Boolean(env.DEEPSEEK_API_KEY);
export const hasR2 = Boolean(
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET,
);
export const hasOpsAlerts = Boolean(env.OPS_ALERT_WEBHOOK_URL);
