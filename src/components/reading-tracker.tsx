"use client";

import { useEffect } from "react";

export function ReadingTracker({ caseId }: { caseId: string }) {
  useEffect(() => {
    let elapsed = 0;
    let maxDepth = 0;
    let sent = false;
    const startedAt = Date.now();
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      maxDepth = Math.max(maxDepth, available > 0 ? Math.min(100, Math.round((window.scrollY / available) * 100)) : 100);
      if (!sent && elapsed >= 30 && maxDepth >= 50) {
        sent = true;
        const body = JSON.stringify({ name: "qualified_case_reader", caseId, durationSeconds: elapsed, readingDepth: maxDepth, path: window.location.pathname });
        if (navigator.sendBeacon) navigator.sendBeacon("/api/v1/events", new Blob([body], { type: "application/json" }));
        else void fetch("/api/v1/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
      }
    };
    const timer = window.setInterval(() => { elapsed = Math.floor((Date.now() - startedAt) / 1000); onScroll(); }, 1000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.clearInterval(timer); window.removeEventListener("scroll", onScroll); };
  }, [caseId]);
  return null;
}
