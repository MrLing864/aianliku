import "server-only";

import { getDb } from "@/lib/db/mongodb";
import { env, hasAI, hasEmail, hasMongo, hasOpsAlerts, hasR2 } from "@/lib/env";

export interface SystemHealthCheck {
  id: "mongodb" | "deepseek" | "email" | "r2" | "alerts";
  name: string;
  state: "ready" | "configured" | "missing" | "error";
  detail: string;
  latencyMs?: number;
}

export async function getSystemHealth(): Promise<SystemHealthCheck[]> {
  let mongo: SystemHealthCheck = {
    id: "mongodb",
    name: "MongoDB",
    state: "missing",
    detail: "未配置，正式案例、报告和线索写入关闭",
  };
  if (hasMongo) {
    const startedAt = performance.now();
    try {
      await (await getDb()).command({ ping: 1 });
      const latencyMs = Math.round(performance.now() - startedAt);
      mongo = {
        id: "mongodb",
        name: "MongoDB",
        state: "ready",
        detail: `数据库 ${env.MONGODB_DB} 连接正常`,
        latencyMs,
      };
    } catch {
      mongo = {
        id: "mongodb",
        name: "MongoDB",
        state: "error",
        detail: "已配置但当前无法连接，请立即检查 Atlas 网络和凭据",
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
      id: "email",
      name: "报告通知",
      state: hasEmail ? "configured" : "missing",
      detail: hasEmail
        ? `发件人 ${env.EMAIL_FROM}`
        : "未配置，报告完成后无法发送通知",
    },
    {
      id: "r2",
      name: "来源快照",
      state: hasR2 ? "configured" : "missing",
      detail: hasR2
        ? `私有桶 ${env.R2_BUCKET}`
        : "未配置，后台来源快照上传关闭",
    },
    {
      id: "alerts",
      name: "运营告警",
      state: hasOpsAlerts ? "configured" : "missing",
      detail: hasOpsAlerts
        ? "报告生成、通知和删除异常将发送脱敏告警"
        : "未配置，关键异步故障只能在后台与日志中发现",
    },
  ];
}
