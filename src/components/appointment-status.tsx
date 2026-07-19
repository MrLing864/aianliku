"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const options = [{ value: "new", label: "新提交" }, { value: "pending", label: "待联系" }, { value: "contacted", label: "已联系" }, { value: "completed", label: "已完成" }, { value: "invalid", label: "无效" }, { value: "cancelled", label: "已取消" }];
export function AppointmentStatus({ id, value }: { id: string; value: string }) { const router = useRouter(); const [current, setCurrent] = useState(value); async function update(next: string) { setCurrent(next); const response = await fetch(`/api/admin/appointments/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) }); if (response.ok) router.refresh(); else setCurrent(value); } return <Select value={current} onValueChange={update}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>; }
