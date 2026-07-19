import { NextResponse } from "next/server";
import { getRun } from "workflow/api";
import {
  getAssessmentJobByStatusToken,
  markAssessmentJobFailed,
} from "@/lib/repositories/reports";

type Params = Promise<{ token: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { token } = await params;
  const job = await getAssessmentJobByStatusToken(token);
  if (!job) {
    return NextResponse.json({ error: "任务不存在或已删除" }, { status: 404 });
  }

  let status = job.status;
  if ((status === "queued" || status === "processing") && job.runId) {
    try {
      const runStatus = await getRun(job.runId).status;
      if (runStatus === "failed" || runStatus === "cancelled") {
        await markAssessmentJobFailed(job.id, "WORKFLOW_EXECUTION_FAILED");
        status = "failed";
      }
    } catch {
      // MongoDB 业务状态仍是主状态；工作流观测短暂不可用时不误报失败。
    }
  }

  const payload = statusPayload(status);
  return NextResponse.json(
    {
      ...payload,
      jobId: job.id,
      notificationStatus: job.notificationStatus,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    },
    { headers: { "cache-control": "no-store, private" } },
  );
}

function statusPayload(status: string) {
  if (status === "queued") {
    return {
      status,
      progress: 12,
      stage: "queued",
      message: "任务已进入安全队列，正在准备企业分析上下文。",
    };
  }
  if (status === "processing") {
    return {
      status,
      progress: 58,
      stage: "reasoning",
      message: "DeepSeek V4-Pro 正在进行最高强度推理与 ROI 假设校验。",
    };
  }
  if (status === "ready") {
    return {
      status,
      progress: 100,
      stage: "ready",
      message: "完整报告已生成，可通过私密链接查看。",
    };
  }
  if (status === "failed") {
    return {
      status,
      progress: 100,
      stage: "failed",
      message: "本次生成没有完成，未产生错误报告。请重新提交。",
      retryable: true,
    };
  }
  return {
    status: "deleted",
    progress: 100,
    stage: "deleted",
    message: "任务及相关数据已删除。",
  };
}
