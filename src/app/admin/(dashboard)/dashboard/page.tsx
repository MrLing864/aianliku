import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarClock, FileCheck2, FileStack, Fingerprint, Import, MailWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getAdminStats();
  const cards = [
    { label: "已发布案例", value: stats.cases, icon: FileCheck2, href: "/admin/cases" },
    { label: "草稿", value: stats.drafts, icon: FileStack, href: "/admin/cases?status=draft" },
    { label: "待审核", value: stats.review, icon: Import, href: "/admin/cases?status=in_review" },
    { label: "重复候选", value: stats.duplicates, icon: Fingerprint, href: "/admin/duplicates" },
    { label: "报告生成中", value: stats.reportJobs, icon: BrainCircuit, href: "/admin/assessments" },
    { label: "报告异常", value: stats.reportIssues, icon: MailWarning, href: "/admin/assessments" },
    { label: "新预约", value: stats.appointments, icon: CalendarClock, href: "/admin/appointments" },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><p className="text-xs font-semibold text-primary">运营概览</p>{stats.mode === "demo" && <Badge variant="secondary">演示数据</Badge>}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">今天先处理什么？</h1>
        </div>
        <Button asChild><Link href="/admin/cases/new">发布新案例<ArrowRight /></Link></Button>
      </div>
      {stats.mode === "demo" && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">尚未配置 MongoDB，后台当前为只读演示模式；导入流程仍可做去重预检。</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link href={href} key={label}>
            <Card className="h-full shadow-none transition-colors hover:border-primary/35"><CardContent><Icon className="size-5 text-primary" /><p className="mt-6 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></CardContent></Card>
          </Link>
        ))}
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Card className="shadow-none"><CardHeader><CardTitle>推荐工作流</CardTitle></CardHeader><CardContent className="space-y-3">{["导入或粘贴来源材料", "检查 URL / 文档哈希幂等", "企业归一与 AI 字段抽取", "审核相似案例和关键事实", "人工确认后发布"].map((value, index) => <div key={value} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>{value}</div>)}</CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle>快捷入口</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Button variant="outline" asChild className="h-auto justify-start p-4"><Link href="/admin/imports"><Import />批量导入</Link></Button><Button variant="outline" asChild className="h-auto justify-start p-4"><Link href="/admin/duplicates"><Fingerprint />审核重复候选</Link></Button><Button variant="outline" asChild className="h-auto justify-start p-4"><Link href="/admin/assessments"><BrainCircuit />查看报告任务</Link></Button><Button variant="outline" asChild className="h-auto justify-start p-4"><Link href="/admin/appointments"><CalendarClock />处理专家预约</Link></Button></CardContent></Card>
      </div>
    </div>
  );
}
