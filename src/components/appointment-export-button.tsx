"use client";

import { useState } from "react";
import { Download, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AppointmentExportButton() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/appointments/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!response?.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "导出失败，请稍后重试");
      setLoading(false);
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aianliku-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setPassword("");
    setLoading(false);
    setOpen(false);
  }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setPassword(""); setError(""); } }}>
    <DialogTrigger asChild><Button variant="outline"><Download />导出联系方式</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>导出敏感联系方式</DialogTitle><DialogDescription>文件仅包含回访所需的最小字段。请再次验证管理员密码；导出数量、字段和操作人将写入审计日志。</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor="appointment-export-password">管理员密码</Label><Input id="appointment-export-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && password.length >= 8) void download(); }} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <DialogFooter><Button onClick={download} disabled={loading || password.length < 8}>{loading ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}验证并下载 CSV</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
