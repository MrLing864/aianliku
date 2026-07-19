import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFollowUp } from "@/lib/ai/assessment";
import { checkRateLimit } from "@/lib/rate-limit";
const schema = z.object({ industry: z.string().optional(), size: z.string().optional(), business: z.string().optional(), repeatedWork: z.string().min(2).max(1000) });
export async function POST(request: Request) { const rate = await checkRateLimit(request, "assessment_followup", 30, 60 * 60 * 1000); if (!rate.allowed) return NextResponse.json({ error: "请求过于频繁，请稍后重试。" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 }); return NextResponse.json(await generateFollowUp(parsed.data)); }
