import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/dal";
import { writeAuditLog } from "@/lib/audit";
import { getDb, isDbConfigured } from "@/lib/db/cloudbase";
import { contentTypeFromKey, deletePrivateObject, getPrivateObject, isBlobConfigured, uploadPrivateObject } from "@/lib/storage/blob";

const uploadSchema = z.object({ content: z.string().min(1).max(5_000_000), contentType: z.enum(["text/plain", "text/html", "application/json"]).default("text/plain") });

async function sourceForAdmin(id: string) {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  return db.collection("sources").findOne({ id }, { projection: { _id: 0 } });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = (await params).id;
  const source = await sourceForAdmin(id);
  if (!source?.snapshotKey) return NextResponse.json({ error: "快照不存在" }, { status: 404 });
  if (!isBlobConfigured()) return NextResponse.json({ error: "对象存储尚未配置" }, { status: 503 });
  const obj = await getPrivateObject(String(source.snapshotKey));
  if (!obj) return NextResponse.json({ error: "快照不存在" }, { status: 404 });
  await writeAuditLog({ actor: session.user?.email ?? "admin", action: "source.snapshot_access", entityType: "source", entityId: id, metadata: { expiresIn: 300 } });
  return new NextResponse(obj.content, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFromKey(String(source.snapshotKey)),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "CloudBase 尚未配置" }, { status: 503 });
  if (!isBlobConfigured()) return NextResponse.json({ error: "对象存储尚未配置" }, { status: 503 });
  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "快照内容无效或超过 5 MB" }, { status: 400 });
  const id = (await params).id;
  const source = await sourceForAdmin(id);
  if (!source) return NextResponse.json({ error: "来源不存在" }, { status: 404 });
  const digest = createHash("sha256").update(parsed.data.content).digest("hex");
  const extension = parsed.data.contentType === "text/html" ? "html" : parsed.data.contentType === "application/json" ? "json" : "txt";
  const key = `sources/${id}/${digest}.${extension}`;
  await uploadPrivateObject(key, parsed.data.content, parsed.data.contentType);
  const db = await getDb();
  const previousKey = source.snapshotKey ? String(source.snapshotKey) : undefined;
  await db.collection("sources").updateOne({ id }, { $set: { snapshotKey: key, snapshotHash: digest, snapshotContentType: parsed.data.contentType, snapshotUpdatedAt: new Date() } });
  if (previousKey && previousKey !== key) await deletePrivateObject(previousKey).catch(() => undefined);
  await writeAuditLog({ actor: session.user?.email ?? "admin", action: "source.snapshot_upload", entityType: "source", entityId: id, metadata: { contentType: parsed.data.contentType, contentHash: digest } });
  return NextResponse.json({ ok: true, contentHash: digest });
}
