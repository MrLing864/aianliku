import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";

const schema = z.object({ type: z.string().max(30).default("general"), name: z.string().min(1).max(50), company: z.string().max(100).optional(), contact: z.string().min(3).max(120), message: z.string().min(10).max(3000) });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "请检查必填项" }, { status: 400 }); if (isMongoConfigured()) { const db = await getDb(); await db.collection("contact_requests").insertOne({ id: nanoid(), ...parsed.data, status: "new", createdAt: new Date() }); } return NextResponse.json({ ok: true }); }
