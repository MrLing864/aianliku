"use client";

import { useEffect } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

export function SearchEventTracker({ active }: { active: boolean }) {
  useEffect(() => { if (active) trackPublicEvent("search"); }, [active]);
  return null;
}
