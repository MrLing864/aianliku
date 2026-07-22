"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type JobState = {
  status: "queued" | "processing" | "ready" | "failed" | "deleted";
  progress: number;
  stage: string;
  message: string;
};

const initialState: JobState = {
  status: "queued",
  progress: 8,
  stage: "queued",
  message: "任务正在安全入队。",
};

export function AssessmentProcessing({
  statusToken,
  reportToken,
}: {
  statusToken: string;
  reportToken: string;
}) {
  const router = useRouter();
  const [job, setJob] = useState<JobState>(initialState);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    function stopPolling() {
      clearInterval(interval);
    }

    async function refresh() {
      const response = await fetch(`/api/v1/assessment-jobs/${statusToken}`, {
        cache: "no-store",
      }).catch(() => null);
      if (cancelled) return;
      if (response?.status === 404) {
        setNetworkError(false);
        setJob({
          status: "deleted",
          progress: 100,
          stage: "deleted",
          message: "任务不存在、已失效或相关数据已经删除。",
        });
        stopPolling();
        return;
      }
      if (!response?.ok) {
        setNetworkError(true);
        return;
      }

      const data = (await response.json()) as JobState;
      setNetworkError(false);
      setJob(data);
      if (data.status === "failed" || data.status === "deleted") stopPolling();
      if (data.status === "ready") {
        stopPolling();
        redirectTimer = setTimeout(() => {
          router.replace(`/reports/${reportToken}`);
        }, 1400);
      }
    }

    const interval = setInterval(() => void refresh(), 4000);
    void refresh();
    return () => {
      cancelled = true;
      stopPolling();
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [reportToken, router, statusToken]);

  const failed = job.status === "failed" || job.status === "deleted";
  const ready = job.status === "ready";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          {ready ? (
            <CheckCircle2 className="size-7" />
          ) : failed ? (
            <RotateCcw className="size-7" />
          ) : (
            <BrainCircuit className="size-7" />
          )}
        </span>
        <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-primary">
          {ready ? "报告已完成" : failed ? "本次任务未完成" : "深度报告生成中"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {ready
            ? "正在打开你的私密报告"
            : failed
              ? "没有用不完整结果敷衍你"
              : "可以放心离开，不必守着页面"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          {failed
            ? "生成过程未达到结构与质量要求，因此没有保存错误报告。你可以返回重新提交。"
            : "DeepSeek V4-Pro 正在以最高强度推理。完整报告生成后，本页会自动进入私密报告。"}
        </p>
      </div>

      <Card className="mt-9 overflow-hidden shadow-none">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">生成进度</span>
            <span className="text-muted-foreground">{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="mt-3 h-2" />
          <p aria-live="polite" className="mt-4 text-sm leading-6 text-muted-foreground">
            {networkError ? "网络暂时波动，正在自动重连，不会影响后台生成。" : job.message}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <StatusItem
              icon={Clock3}
              title="安全入队"
              description="保存问诊与私密访问凭证"
              active={job.status === "queued"}
              done={job.status !== "queued"}
            />
            <StatusItem
              icon={BrainCircuit}
              title="V4-Pro 推理"
              description="方案优先级与 ROI 假设校验"
              active={job.status === "processing"}
              done={ready}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              任务可跨服务重启恢复，不会因关闭页面中断
            </div>
            <div className="flex gap-2">
              {failed ? (
                <Button asChild>
                  <Link href="/assessment">
                    重新体检
                    <RotateCcw />
                  </Link>
                </Button>
              ) : ready ? (
                <Button asChild>
                  <Link href={`/reports/${reportToken}`}>
                    立即查看
                    <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/cases">等待时浏览案例</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  title,
  description,
  active,
  done,
}: {
  icon: typeof LoaderCircle;
  title: string;
  description: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-primary/30 bg-primary/[0.04]" : "bg-muted/20"}`}>
      <div className="flex items-center gap-2">
        {active && !done ? (
          <LoaderCircle className="size-4 animate-spin text-primary" />
        ) : done ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Icon className="size-4 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
