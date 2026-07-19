import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ type: z.enum(["general", "correction", "case", "cooperation"]).default("general"), caseId: z.string().max(100).optional(), name: z.string().min(1).max(50), company: z.string().max(100).optional(), contact: z.string().min(3).max(120), message: z.string().min(10).max(3000) });
export async function POST(request: Request) { const rate = await checkRateLimit(request, "contact", 5, 60 * 60 * 1000); if (!rate.allowed) return NextResponse.json({ error: "提交过于频繁，请稍后再试。" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "请检查必填项" }, { status: 400 }); if (!isMongoConfigured()) return NextResponse.json({ error: "留言服务正在配置，请稍后重试或发送邮件至 hello@aianliku.cn。", code: "CONTACT_STORAGE_NOT_CONFIGURED" }, { status: 503 }); const db = await getDb(); await db.collection("contact_requests").insertOne({ id: nanoid(), ...parsed.data, status: "new", createdAt: new Date() }); return NextResponse.json({ ok: true }, { status: 201 }); }
