import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";

const eventSchema = z.object({ name: z.enum(["qualified_case_reader", "case_view", "search", "assessment_started", "assessment_completed", "report_claimed", "appointment_submitted"]), caseId: z.string().max(100).optional(), durationSeconds: z.number().min(0).max(86400).optional(), readingDepth: z.number().min(0).max(100).optional(), path: z.string().max(500).optional() });
export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  if (isMongoConfigured()) { const db = await getDb(); await db.collection("analytics_events").insertOne({ id: nanoid(), ...parsed.data, occurredAt: new Date(), userAgent: request.headers.get("user-agent")?.slice(0, 300) }); }
  return new NextResponse(null, { status: 204 });
}
