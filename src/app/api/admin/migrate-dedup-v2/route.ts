/**
 * 历史数据迁移触发端点（计划七）
 * 管理员鉴权后执行 runMigration。默认预演（dry-run），?apply=1 才真实写入。
 * 用法：POST /api/admin/migrate-dedup-v2  或  POST /api/admin/migrate-dedup-v2?apply=1
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { runMigration } from "@/lib/dedup/migrate";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 鉴权：管理员会话 或 内部密钥（便于运维脚本触发）
  const internalKey = req.headers.get("x-internal-key");
  const viaInternal = Boolean(env.INTERNAL_API_KEY) && internalKey === env.INTERNAL_API_KEY;
  if (!viaInternal) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const apply = req.nextUrl.searchParams.get("apply") === "1";
  try {
    const report = await runMigration(apply);
    return NextResponse.json({ ok: true, apply, report });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
