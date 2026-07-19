"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const labels = { new: "待处理", investigating: "核查中", corrected: "已更正", rejected: "已驳回", closed: "已关闭" } as const;

export function CorrectionStatus({ id, value }: { id: string; value: keyof typeof labels }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function update(status: string) {
    setLoading(true);
    const response = await fetch(`/api/admin/corrections/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    setLoading(false);
    if (response.ok) router.refresh();
  }
  return <Select value={value} onValueChange={update} disabled={loading}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).map(([status, label]) => <SelectItem key={status} value={status}>{label}</SelectItem>)}</SelectContent></Select>;
}
