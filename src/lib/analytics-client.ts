"use client";

type PublicEventName =
  | "case_view"
  | "search"
  | "search_zero_result"
  | "assessment_started"
  | "assessment_completed"
  | "assessment_roi_recalculate"
  | "report_claimed"
  | "appointment_submitted";

export function trackPublicEvent(
  name: PublicEventName,
  caseId?: string,
  metadata?: { policyVersion?: string },
) {
  const body = JSON.stringify({
    name,
    caseId,
    path: window.location.pathname,
    ...metadata,
  });
  if (navigator.sendBeacon)
    navigator.sendBeacon(
      "/api/v1/events",
      new Blob([body], { type: "application/json" }),
    );
  else
    void fetch("/api/v1/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
}
