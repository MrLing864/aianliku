"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const privatePathPrefixes = ["/admin", "/reports/", "/assessment/status/"];

export function PrivacyAwareAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const pathname = new URL(event.url).pathname;
        return privatePathPrefixes.some((prefix) => pathname.startsWith(prefix))
          ? null
          : event;
      }}
    />
  );
}
