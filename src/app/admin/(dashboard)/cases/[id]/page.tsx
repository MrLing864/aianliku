import { notFound } from "next/navigation";
import { CaseEditor } from "@/components/case-editor";
import { isMongoConfigured } from "@/lib/db/mongodb";
import { getAdminCase } from "@/lib/repositories/admin";
export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) { const item = await getAdminCase((await params).id); if (!item) notFound(); return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold text-primary">案例管理</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">编辑案例</h1><p className="mt-2 text-sm text-muted-foreground">所有发布动作都会记录审计日志。</p><div className="mt-7"><CaseEditor item={item} readOnlyDemo={!isMongoConfigured()} /></div></div>; }
