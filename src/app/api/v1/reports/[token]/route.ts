import { NextResponse } from "next/server";
import { deleteReportByToken } from "@/lib/repositories/reports";
export async function DELETE(_: Request, { params }: { params: Promise<{ token: string }> }) { const token = (await params).token; if (token === "demo") return NextResponse.json({ ok: true, demo: true }); const deleted = await deleteReportByToken(token); return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 404 }); }
