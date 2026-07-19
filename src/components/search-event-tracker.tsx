"use client";

import { useEffect } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

export function SearchEventTracker({
  active,
  zeroResults,
}: {
  active: boolean;
  zeroResults: boolean;
}) {
  useEffect(() => {
    if (!active) return;
    trackPublicEvent("search");
    if (zeroResults) trackPublicEvent("search_zero_result");
  }, [active, zeroResults]);
  return null;
}
