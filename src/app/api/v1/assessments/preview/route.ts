import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createFallbackReport } from "@/lib/assessment";
import { assessmentInputSchema } from "@/lib/validation/assessment";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "assessment_preview", 20, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "预览生成过于频繁，请稍后重试。" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } });
  const parsed = assessmentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请补充完整的问诊信息", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const report = createFallbackReport(nanoid(18), parsed.data);
  return NextResponse.json({
    preview: {
      companyProfile: report.companyProfile,
      diagnosis: report.diagnosis,
      recommendations: report.recommendations,
      roi: report.roi,
    },
  });
}
