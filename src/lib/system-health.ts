import "server-only";

import { getDb } from "@/lib/db/cloudbase";
import { env, hasAI, hasDb, hasOpsAlerts, hasCos } from "@/lib/env";

export interface SystemHealthCheck {
  id: "cloudbase" | "deepseek" | "cos" | "alerts";
  name: string;
  state: "ready" | "configured" | "missing" | "error";
  detail: string;
  latencyMs?: number;
}

export async function getSystemHealth(): Promise<SystemHealthCheck[]> {
  let mongo: SystemHealthCheck = {
    id: "cloudbase",
    name: "CloudBase",
    state: "missing",
    detail: "未配置，正式案例、报告和线索写入关闭",
  };
  if (hasDb) {
    const startedAt = performance.now();
    try {
      await (await getDb()).command({ ping: 1 });
      const latencyMs = Math.round(performance.now() - startedAt);
      mongo = {
        id: "cloudbase",
        name: "CloudBase",
        state: "ready",
        detail: `数据库 ${env.CLOUDBASE_ENV} 连接正常`,
        latencyMs,
      };
    } catch {
      mongo = {
        id: "cloudbase",
        name: "CloudBase",
        state: "error",
        detail: "已配置但当前无法连接，请立即检查 CloudBase 环境和凭据",
      };
    }
  }

  return [
    mongo,
    {
      id: "deepseek",
      name: "DeepSeek",
      state: hasAI ? "configured" : "missing",
      detail: hasAI
        ? `${env.AI_MODEL}（深度报告）/ ${env.AI_FAST_MODEL}（动态追问）`
        : "未配置，完整报告任务不会接受提交",
    },
    {
      id: "cos",
      name: "来源快照",
      state: hasCos ? "configured" : "missing",
      detail: hasCos
        ? `私有桶 ${env.COS_BUCKET}（${env.COS_REGION}）`
        : "未配置，后台来源快照上传关闭",
    },
    {
      id: "alerts",
      name: "运营告警",
      state: hasOpsAlerts ? "configured" : "missing",
        detail: hasOpsAlerts
          ? "报告生成和删除异常将发送脱敏告警"
          : "未配置，关键异步故障只能在后台与日志中发现",
    },
  ];
}
