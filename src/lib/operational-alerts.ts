import "server-only";

import { env } from "@/lib/env";

export type OperationalAlertType =
  | "assessment_start_failed"
  | "assessment_generation_failed"
  | "assessment_notification_failed"
  | "assessment_deletion_failed";

interface OperationalAlert {
  type: OperationalAlertType;
  severity: "warning" | "critical";
  subjectId: string;
  errorCode: string;
}

export async function sendOperationalAlert(alert: OperationalAlert) {
  if (!env.OPS_ALERT_WEBHOOK_URL) return false;
  try {
    const response = await fetch(env.OPS_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.OPS_ALERT_BEARER_TOKEN
          ? { authorization: `Bearer ${env.OPS_ALERT_BEARER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        schemaVersion: 1,
        service: "aianliku",
        environment:
          process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        occurredAt: new Date().toISOString(),
        ...alert,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      console.error("operational_alert_delivery_failed", {
        type: alert.type,
        status: response.status,
      });
    }
    return response.ok;
  } catch (error) {
    console.error("operational_alert_delivery_failed", {
      type: alert.type,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
    return false;
  }
}
