import {
  BellRing,
  CheckCircle2,
  CircleOff,
  Database,
  Gauge,
  Sparkles,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSystemHealth, type SystemHealthCheck } from "@/lib/system-health";

const icons: Record<SystemHealthCheck["id"], typeof Database> = {
  cloudbase: Database,
  deepseek: Sparkles,
  blob: Warehouse,
  alerts: BellRing,
};

const labels = {
  ready: "连接正常",
  configured: "已配置",
  missing: "待配置",
  error: "连接异常",
} as const;

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const checks = await getSystemHealth();
  const databaseReady =
    checks.find((item) => item.id === "cloudbase")?.state === "ready";
  const analysisReady =
    checks.find((item) => item.id === "deepseek")?.state === "configured";
  const reportLoopReady = databaseReady && analysisReady;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold text-primary">系统配置</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">运行状态</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            显示真实连接状态和功能边界，不展示密钥或连接字符串。
          </p>
        </div>
        <Badge
          variant={reportLoopReady ? "default" : "secondary"}
          className="h-7 px-3"
        >
          {reportLoopReady ? "完整报告闭环已就绪" : "完整报告闭环待配置"}
        </Badge>
      </div>

      <Card
        className={`mt-7 shadow-none ${reportLoopReady ? "border-primary/25 bg-primary/[0.035]" : "border-amber-200 bg-amber-50/55"}`}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-xl border bg-background ${reportLoopReady ? "text-primary" : "text-amber-700"}`}
          >
            <Gauge className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold">企业体检完整链路</h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {reportLoopReady
                ? "问诊可进入后台深度分析，报告能够生成并保存。"
                : "浏览案例和免费预览仍可使用；数据库与深度分析必须同时就绪后才接受完整报告提交。"}
            </p>
          </div>
          {reportLoopReady ? (
            <CheckCircle2 className="size-6 text-primary" />
          ) : (
            <TriangleAlert className="size-6 text-amber-700" />
          )}
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {checks.map((check) => {
          const Icon = icons[check.id];
          const available =
            check.state === "ready" || check.state === "configured";
          return (
            <Card key={check.id} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl border text-primary">
                    <Icon className="size-5" />
                  </span>
                  <Badge
                    variant={
                      check.state === "error"
                        ? "destructive"
                        : available
                          ? "default"
                          : "secondary"
                    }
                  >
                    {labels[check.state]}
                  </Badge>
                </div>
                <h2 className="mt-5 font-semibold">{check.name}</h2>
                <p className="mt-2 min-h-16 text-xs leading-5 text-muted-foreground">
                  {check.detail}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  {available ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <CircleOff className="size-4 text-amber-600" />
                  )}
                  {check.latencyMs === undefined
                    ? available
                      ? "功能已启用"
                      : "相关功能安全关闭"
                    : `${check.latencyMs} ms`}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">去重阈值</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-rose-50 p-4">
              <p className="text-xs text-rose-700">高疑似重复</p>
              <p className="mt-1 font-mono font-semibold">≥ 0.90</p>
              <p className="mt-2 text-xs text-rose-800">阻止直接发布</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-700">人工复核提示</p>
              <p className="mt-1 font-mono font-semibold">0.75–0.90</p>
              <p className="mt-2 text-xs text-amber-800">进入候选审核</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">低相似</p>
              <p className="mt-1 font-mono font-semibold">&lt; 0.75</p>
              <p className="mt-2 text-xs text-emerald-800">允许正常暂存</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
