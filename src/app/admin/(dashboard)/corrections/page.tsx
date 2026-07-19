import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { CorrectionStatus } from "@/components/correction-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listContactRequests } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";
export default async function CorrectionsPage() {
  const items = await listContactRequests("correction");
  return <div><p className="text-xs font-semibold text-primary">内容治理</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">内容更正</h1><p className="mt-2 text-sm text-muted-foreground">每个请求都有独立工单状态；核查时保留依据和处理记录。</p>{items.length ? <div className="mt-7 space-y-4">{items.map((item) => <Card key={item.id} className="shadow-none"><CardContent className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.name}{item.company ? ` · ${item.company}` : ""}</h2>{item.caseId && <Badge variant="outline">案例 {item.caseId}</Badge>}</div><p className="mt-2 text-xs text-muted-foreground">{item.contact} · {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</p></div><CorrectionStatus id={item.id} value={item.status} /></div><p className="mt-5 rounded-lg bg-muted/55 p-4 text-sm leading-7">{item.message}</p>{item.caseId && <Button variant="outline" size="sm" asChild className="mt-4"><Link href={`/admin/cases/${item.caseId}`}>打开关联案例</Link></Button>}</CardContent></Card>)}</div> : <div className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed text-center"><div><MessageSquareWarning className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">暂无更正请求</h2></div></div>}</div>;
}
