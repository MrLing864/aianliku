import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRoiVersionByToken } from "@/lib/repositories/reports";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ investment: z.number().min(0).max(1_000_000_000), monthlyCost: z.number().min(0).max(1_000_000_000), monthlySaving: z.number().min(0).max(1_000_000_000) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rate = await checkRateLimit(request, "roi_version", 30, 60 * 60 * 1_000);
  if (!rate.allowed) return NextResponse.json({ error: "保存过于频繁，请稍后再试。" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请输入有效的非负金额" }, { status: 400 });
  const token = (await params).token;
  if (token === "demo") return NextResponse.json({ ok: true, demo: true, version: { version: 1, ...parsed.data, paybackMonths: parsed.data.monthlySaving > parsed.data.monthlyCost ? parsed.data.investment / (parsed.data.monthlySaving - parsed.data.monthlyCost) : null } });
  const version = await saveRoiVersionByToken(token, parsed.data);
  if (!version) return NextResponse.json({ error: "报告不存在或链接已失效" }, { status: 404 });
  return NextResponse.json({ ok: true, version }, { status: 201, headers: { "cache-control": "no-store, private" } });
}
