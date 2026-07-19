"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ defaultType = "general" }: { defaultType?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }).catch(() => null);
    setStatus(response?.ok ? "done" : "error"); if (response?.ok) event.currentTarget.reset();
  }
  if (status === "done") return <div className="grid min-h-80 place-items-center text-center"><div><CheckCircle2 className="mx-auto size-10 text-primary" /><h2 className="mt-4 text-xl font-semibold">信息已经收到</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">我们会先核对内容，再通过你留下的联系方式回复。</p><Button variant="outline" onClick={() => setStatus("idle")} className="mt-5">继续提交</Button></div></div>;
  return <form onSubmit={submit} className="space-y-5"><input type="hidden" name="type" value={defaultType} /><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">姓名</Label><Input id="name" name="name" required maxLength={50} placeholder="怎么称呼你" /></div><div className="space-y-2"><Label htmlFor="company">企业 / 机构</Label><Input id="company" name="company" maxLength={100} placeholder="选填" /></div></div><div className="space-y-2"><Label htmlFor="contact">邮箱或手机号</Label><Input id="contact" name="contact" required maxLength={120} placeholder="用于回复，不作其他用途" /></div><div className="space-y-2"><Label htmlFor="message">具体内容</Label><Textarea id="message" name="message" required minLength={10} maxLength={3000} className="min-h-36" placeholder={defaultType === "correction" ? "请注明案例链接、需要更正的内容及依据" : "请描述你的需求、案例线索或合作想法"} /></div>{status === "error" && <p role="alert" className="text-sm text-destructive">提交没有成功，请稍后重试或发送邮件至 hello@aianliku.cn。</p>}<Button type="submit" size="lg" disabled={status === "sending"} className="w-full sm:w-auto">{status === "sending" ? <LoaderCircle className="animate-spin" /> : <Send />}提交信息</Button><p className="text-xs leading-5 text-muted-foreground">提交即表示你同意我们仅为处理本次请求而保存和使用以上信息。你可以随时申请删除。</p></form>;
}
