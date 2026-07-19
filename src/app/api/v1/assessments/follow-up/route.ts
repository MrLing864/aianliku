import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFollowUp } from "@/lib/ai/assessment";
const schema = z.object({ industry: z.string().optional(), size: z.string().optional(), business: z.string().optional(), repeatedWork: z.string().min(2).max(1000) });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 }); return NextResponse.json(await generateFollowUp(parsed.data)); }
