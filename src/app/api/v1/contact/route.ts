import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import {
  CONTACT_CONSENT_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/policies";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordServerEvent } from "@/lib/server-analytics";

const requiredPhone = z
  .string()
  .trim()
  .min(1, "请输入手机号")
  .max(30)
  .refine(
    (value) => /^(?:\+?86)?1[3-9]\d{9}$/u.test(value.replace(/[\s-]/gu, "")),
    "请输入有效的中国大陆手机号",
  );

const schema = z.object({
  type: z
    .enum(["general", "correction", "case", "cooperation"])
    .default("general"),
  caseId: z.string().max(100).optional(),
  name: z.string().trim().min(1).max(50),
  company: z.string().trim().max(100).optional(),
  phone: requiredPhone,
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
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error: "留言服务正在配置，请稍后重试或通过页面底部联系方式与我们联系。",
        code: "CONTACT_STORAGE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }
  const db = await getDb();
  const now = new Date();
  const { privacyConsent, ...input } = parsed.data;
  const id = nanoid();
  await db.collection("contact_requests").insertOne({
    id,
    ...input,
    phone: input.phone.replace(/[\s-]/gu, ""),
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
  await recordServerEvent("contact_submitted", id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
