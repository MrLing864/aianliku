import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
const schema = z.object({ reportId: z.string().max(100).optional(), name: z.string().min(1).max(50), company: z.string().min(1).max(100), role: z.string().max(100).optional(), need: z.string().min(10).max(2000), phone: z.string().max(30).optional(), wechat: z.string().max(80).optional(), preferredTime: z.string().max(100).optional() }).refine((value) => Boolean(value.phone?.trim() || value.wechat?.trim()), { message: "手机号或微信至少填写一项" });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 }); if (isMongoConfigured()) { const db = await getDb(); await db.collection("appointments").insertOne({ id: nanoid(), ...parsed.data, status: "new", createdAt: new Date() }); } return NextResponse.json({ ok: true }); }
