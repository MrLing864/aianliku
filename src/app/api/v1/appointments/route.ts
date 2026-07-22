import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import {
  APPOINTMENT_CONSENT_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/policies";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordServerEvent } from "@/lib/server-analytics";
const schema = z
  .object({
    reportId: z.string().max(100).optional(),
    name: z.string().trim().min(1).max(50),
    company: z.string().trim().min(1).max(100),
    role: z.string().trim().max(100).optional(),
    need: z.string().trim().min(10).max(2000),
    phone: z.string().trim().max(30).optional(),
    wechat: z.string().trim().max(80).optional(),
    preferredTime: z.string().trim().max(100).optional(),
    privacyConsent: z.literal(true),
  })
  .refine((value) => Boolean(value.phone?.trim() || value.wechat?.trim()), {
    message: "手机号或微信至少填写一项",
  })
  .refine(
    (value) =>
      !value.phone?.trim() ||
      /^(?:\+?86)?1[3-9]\d{9}$/u.test(value.phone.replace(/[\s-]/gu, "")),
    { message: "请输入有效的中国大陆手机号", path: ["phone"] },
  )
  .refine(
    (value) => !value.wechat?.trim() || !/[\s\p{Cc}]/u.test(value.wechat),
    {
      message: "微信号不能包含空格或控制字符",
      path: ["wechat"],
    },
  );

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "appointment", 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "预约提交过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "retry-after": String(rate.retryAfterSeconds) },
      },
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error: "预约服务正在配置，请稍后重试或通过邮件联系我们。",
        code: "LEAD_STORAGE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }
  const db = await getDb();
  const normalizedPhone =
    parsed.data.phone?.replace(/[\s-]/gu, "") || undefined;
  const normalizedWechat =
    parsed.data.wechat?.trim().toLocaleLowerCase("zh-CN") || undefined;
  const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicateConditions = [
    {
      ...(parsed.data.reportId ? { reportId: parsed.data.reportId } : {}),
      ...(normalizedPhone
        ? { phone: normalizedPhone }
        : { wechatNormalized: normalizedWechat }),
      createdAt: { $gte: recentSince },
    },
  ];
  const existing = await db
    .collection("appointments")
    .findOne({ $or: duplicateConditions });
  if (existing) {
    await recordServerEvent("expert_booking_submit", String(existing.id));
    return NextResponse.json(
      { ok: true, duplicate: true, id: existing.id },
      { status: 200 },
    );
  }
  const id = nanoid();
  const now = new Date();
  const { privacyConsent, ...input } = parsed.data;
  await db.collection("appointments").insertOne({
    id,
    ...input,
    phone: normalizedPhone,
    wechat: input.wechat?.trim() || undefined,
    wechatNormalized: normalizedWechat,
    status: "new",
    consent: {
      accepted: privacyConsent,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      purposeVersion: APPOINTMENT_CONSENT_VERSION,
      acceptedAt: now,
    },
    createdAt: now,
  });
  await recordServerEvent("expert_booking_submit", id);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
