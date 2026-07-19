import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listAuditLogs } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";
export default async function AuditPage() {
  const items = await listAuditLogs();
  return <div><p className="text-xs font-semibold text-primary">安全与追溯</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">操作日志</h1><p className="mt-2 text-sm text-muted-foreground">日志仅展示最小必要信息，不显示密码、完整令牌、原始问答或敏感正文。</p>{items.length ? <Card className="mt-7 py-0 shadow-none"><CardContent className="divide-y p-0">{items.map((item) => <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center"><div><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(item.createdAt))}</p><p className="mt-1 truncate text-xs">{item.actor}</p></div><div><p className="text-sm font-medium">{item.action}</p><p className="mt-1 text-xs text-muted-foreground">{item.entityType} · {item.entityId}</p></div><Badge variant="outline">成功</Badge></div>)}</CardContent></Card> : <div className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed text-center"><div><ScrollText className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">暂无操作记录</h2></div></div>}</div>;
}
