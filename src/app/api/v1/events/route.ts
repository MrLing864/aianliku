import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { PRIVACY_NOTICE_VERSION } from "@/lib/policies";

const eventSchema = z.object({
  name: z.enum([
    "qualified_case_reader",
    "case_view",
    "search",
    "search_zero_result",
    "assessment_started",
    "assessment_completed",
    "assessment_roi_recalculate",
    "report_claimed",
    "appointment_submitted",
  ]),
  caseId: z.string().max(100).optional(),
  durationSeconds: z.number().min(0).max(86400).optional(),
  readingDepth: z.number().min(0).max(100).optional(),
  path: z.string().max(500).optional(),
  policyVersion: z.literal(PRIVACY_NOTICE_VERSION).optional(),
});

function safePublicPath(value?: string) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.includes("?") ||
    value.includes("#") ||
    /[\s@]/u.test(value)
  )
    return undefined;
  if (
    ["/admin", "/reports/", "/assessment/status/", "/api/"].some((prefix) =>
      value.startsWith(prefix),
    )
  )
    return undefined;
  return value.slice(0, 300);
}

function shanghaiDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function anonymousVisitorKey(request: Request, dateKey: string) {
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent =
    request.headers.get("user-agent")?.slice(0, 300) ?? "unknown";
  const salt = env.AUTH_SECRET ?? "aianliku-local-analytics-only";
  return createHmac("sha256", salt)
    .update(`${dateKey}|${forwarded}|${userAgent}`)
    .digest("hex");
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(
    request,
    "analytics-event",
    180,
    60 * 60 * 1_000,
  );
  if (!rateLimit.allowed)
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  if (
    parsed.data.name === "qualified_case_reader" &&
    (!parsed.data.caseId ||
      (parsed.data.durationSeconds ?? 0) < 30 ||
      (parsed.data.readingDepth ?? 0) < 50)
  )
    return NextResponse.json(
      { error: "invalid_qualified_reader" },
      { status: 400 },
    );
  if (isMongoConfigured()) {
    const db = await getDb();
    const occurredAt = new Date();
    const dateKey = shanghaiDateKey(occurredAt);
    const path = safePublicPath(parsed.data.path);
    const visitorKey = anonymousVisitorKey(request, dateKey);
    const dedupeKey =
      parsed.data.name === "qualified_case_reader"
        ? `${dateKey}:${visitorKey}:${parsed.data.caseId}`
        : undefined;
    try {
      await db
        .collection("analytics_events")
        .insertOne({
          id: nanoid(),
          ...parsed.data,
          path,
          dedupeKey,
          visitorKeyVersion: 1,
          occurredAt,
        });
      if (parsed.data.name === "qualified_case_reader")
        await db
          .collection("cases")
          .updateOne(
            { id: parsed.data.caseId, contentStatus: "published" },
            { $inc: { views: 1 } },
          );
    } catch (error) {
      if (!(error instanceof MongoServerError && error.code === 11000))
        throw error;
    }
  }
  return new NextResponse(null, { status: 204 });
}
