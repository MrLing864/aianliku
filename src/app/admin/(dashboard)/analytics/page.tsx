import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  const stats = await getAnalyticsSummary();
  const cards = [
    { label: "7 天有效读者", value: stats.qualified7d, icon: BookOpenCheck },
    { label: "30 天有效读者", value: stats.qualified30d, icon: BarChart3 },
    { label: "30 天搜索", value: stats.searches30d, icon: Search },
    { label: "30 天零结果", value: stats.zeroSearches30d, icon: SearchX },
    { label: "体检漏斗事件", value: stats.assessments30d, icon: Sparkles },
    { label: "预约提交", value: stats.appointments30d, icon: CalendarCheck2 },
  ];
  return (
    <div>
      <p className="text-xs font-semibold text-primary">数据分析</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        SEO 与增长概览
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        北极星指标：停留至少 30 秒且阅读深度达到 50%
        的独立案例读者。零结果事件不保存原始关键词。
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <Icon className="size-5 text-primary" />
              <p className="mt-5 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">30 天热门案例</h2>
          <div className="mt-4 divide-y">
            {stats.topCases.length ? (
              stats.topCases.map((item, index) => (
                <div key={item.caseId} className="flex items-center gap-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {item.caseId}
                  </p>
                  <strong className="text-sm">{item.readers} 位有效读者</strong>
                </div>
              ))
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                暂无正式统计数据
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
