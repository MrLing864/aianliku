"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssessmentNotificationRetry({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/assessments/${jobId}/retry-email`, {
      method: "POST",
    });
    if (response.ok) {
      router.refresh();
      setLoading(false);
      return;
    }
    const body = await response.json().catch(() => null);
    setError(body?.error ?? "重试失败");
    setLoading(false);
  }

  return (
    <div className="flex min-w-36 flex-col items-end gap-1.5">
      <Button size="sm" variant="outline" onClick={retry} disabled={loading}>
        {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
        重试通知
      </Button>
      {error && <p className="max-w-64 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
