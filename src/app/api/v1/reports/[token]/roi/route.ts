import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRoiVersionByToken } from "@/lib/repositories/reports";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  analyzeRoiInput,
  calculatePaybackMonths,
  ROI_MAX_AMOUNT,
} from "@/lib/roi";

const schema = z.object({
  investment: z.number().finite().min(0).max(ROI_MAX_AMOUNT),
  monthlyCost: z.number().finite().min(0).max(ROI_MAX_AMOUNT),
  monthlySaving: z.number().finite().min(0).max(ROI_MAX_AMOUNT),
  anomaliesConfirmed: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const rate = await checkRateLimit(
    request,
    "roi_version",
    30,
    60 * 60 * 1_000,
  );
  if (!rate.allowed)
    return NextResponse.json(
      { error: "保存过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "retry-after": String(rate.retryAfterSeconds) },
      },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "请输入有效的非负金额" },
      { status: 400 },
    );
  const { anomaliesConfirmed, ...input } = parsed.data;
  const anomalyFlags = analyzeRoiInput(input);
  if (anomalyFlags.length && !anomaliesConfirmed) {
    return NextResponse.json(
      {
        error: "输入可能存在单位或数量级异常，请确认后再计算。",
        code: "ROI_INPUT_CONFIRMATION_REQUIRED",
        issues: anomalyFlags,
      },
      { status: 422 },
    );
  }
  const token = (await params).token;
  if (token === "demo") {
    return NextResponse.json({
      ok: true,
      demo: true,
      version: {
        version: 1,
        ...input,
        paybackMonths: calculatePaybackMonths(input),
        anomalyFlags,
        anomaliesConfirmedAt: anomalyFlags.length
          ? new Date().toISOString()
          : undefined,
      },
    });
  }
  const version = await saveRoiVersionByToken(token, {
    ...input,
    anomalyFlags,
    anomaliesConfirmedAt: anomalyFlags.length
      ? new Date().toISOString()
      : undefined,
  });
  if (!version)
    return NextResponse.json(
      { error: "报告不存在或链接已失效" },
      { status: 404 },
    );
  return NextResponse.json(
    { ok: true, version },
    { status: 201, headers: { "cache-control": "no-store, private" } },
  );
}
