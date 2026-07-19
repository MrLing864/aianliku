"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackPublicEvent } from "@/lib/analytics-client";

export function AppointmentForm({ reportId }: { reportId?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!privacyConsent) {
      setState("error");
      setErrorMessage("请先确认回访信息的处理用途和隐私政策。");
      return;
    }
    setState("sending");
    setErrorMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/v1/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, reportId, privacyConsent }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    setState(response?.ok ? "done" : "error");
    if (response?.ok) trackPublicEvent("appointment_submitted");
    else setErrorMessage(data?.error ?? "预约提交失败，请稍后重试。");
  }

  if (state === "done") {
    return (
      <div className="grid min-h-96 place-items-center text-center">
        <div>
          <CheckCircle2 className="mx-auto size-11 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">预约已提交</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            平台会先人工阅读需求，再通过你留下的手机号或微信联系。通常在 2
            个工作日内回访。
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appointment-name">姓名 *</Label>
          <Input id="appointment-name" name="name" required maxLength={50} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointment-company">企业 *</Label>
          <Input
            id="appointment-company"
            name="company"
            required
            maxLength={100}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-role">你的职位</Label>
        <Input
          id="appointment-role"
          name="role"
          maxLength={100}
          placeholder="如：创始人、信息化负责人"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-need">需求摘要 *</Label>
        <Textarea
          id="appointment-need"
          name="need"
          required
          minLength={10}
          maxLength={2000}
          className="min-h-32"
          placeholder="最希望专家一起判断什么？"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appointment-phone">手机号</Label>
          <Input
            id="appointment-phone"
            name="phone"
            inputMode="tel"
            maxLength={30}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointment-wechat">微信号</Label>
          <Input id="appointment-wechat" name="wechat" maxLength={80} />
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        手机号或微信至少填写一项。平台不会把联系方式公开展示。
      </p>
      <div className="space-y-2">
        <Label htmlFor="preferred-time">方便联系的时间</Label>
        <Input
          id="preferred-time"
          name="preferredTime"
          maxLength={100}
          placeholder="如：工作日下午 2–5 点"
        />
      </div>
      <label className="flex items-start gap-2.5 rounded-xl border bg-muted/25 p-4 text-xs leading-5">
        <Checkbox
          aria-label="同意预约信息隐私处理"
          checked={privacyConsent}
          onCheckedChange={(value) => setPrivacyConsent(value === true)}
        />
        <span>
          同意平台为安排本次人工回访保存和使用姓名、企业、需求及联系方式。我已阅读
          <Link
            href="/privacy"
            target="_blank"
            className="mx-1 text-primary underline underline-offset-2"
          >
            隐私政策
          </Link>
          ，并可随时申请删除。
        </span>
      </label>
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={state === "sending" || !privacyConsent}
      >
        {state === "sending" ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Send />
        )}
        提交预约
      </Button>
    </form>
  );
}
