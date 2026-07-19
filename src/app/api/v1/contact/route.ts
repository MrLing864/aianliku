import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import {
  CONTACT_CONSENT_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/policies";
import { checkRateLimit } from "@/lib/rate-limit";

const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .optional()
  .refine(
    (value) =>
      !value || /^(?:\+?86)?1[3-9]\d{9}$/u.test(value.replace(/[\s-]/gu, "")),
    "请输入有效的中国大陆手机号",
  );

const schema = z.object({
  type: z
    .enum(["general", "correction", "case", "cooperation"])
    .default("general"),
  caseId: z.string().max(100).optional(),
  name: z.string().trim().min(1).max(50),
  company: z.string().trim().max(100).optional(),
  email: z.email("请输入有效邮箱").max(254),
  phone: optionalPhone,
  wechat: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10).max(3000),
  privacyConsent: z.literal(true),
});

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "contact", 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "提交过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "retry-after": String(rate.retryAfterSeconds) },
      },
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "请检查必填项" },
      { status: 400 },
    );
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        error: "留言服务正在配置，请稍后重试或发送邮件至 hello@aianliku.cn。",
        code: "CONTACT_STORAGE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }
  const db = await getDb();
  const now = new Date();
  const { privacyConsent, ...input } = parsed.data;
  await db.collection("contact_requests").insertOne({
    id: nanoid(),
    ...input,
    email: input.email.trim().toLocaleLowerCase("en-US"),
    phone: input.phone?.replace(/[\s-]/gu, "") || undefined,
    wechat: input.wechat?.trim() || undefined,
    status: "new",
    consent: {
      accepted: privacyConsent,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      purposeVersion: CONTACT_CONSENT_VERSION,
      acceptedAt: now,
    },
    createdAt: now,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
