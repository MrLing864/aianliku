"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const inquiryTypes = [
  { value: "general", label: "企业 AI 咨询" },
  { value: "case", label: "提交案例线索" },
  { value: "correction", label: "内容更正" },
  { value: "cooperation", label: "内容或商务合作" },
] as const;

export function ContactForm({
  defaultType = "general",
  caseId,
}: {
  defaultType?: string;
  caseId?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [type, setType] = useState(defaultType);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!privacyConsent) {
      setStatus("error");
      setErrorMessage("请先确认信息处理用途和隐私政策。");
      return;
    }
    setStatus("sending");
    setErrorMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, type, caseId, privacyConsent }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    setStatus(response?.ok ? "done" : "error");
    if (!response?.ok)
      setErrorMessage(
        data?.error ??
          "提交没有成功，请稍后重试或发送邮件至 hello@aianliku.cn。",
      );
  }

  if (status === "done") {
    return (
      <div className="grid min-h-80 place-items-center text-center">
        <div>
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">信息已经收到</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            我们会先核对内容，再通过你留下的邮箱回复。
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setStatus("idle");
              setPrivacyConsent(false);
            }}
            className="mt-5"
          >
            继续提交
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-type">咨询类型 *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="contact-type" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inquiryTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">姓名 *</Label>
          <Input
            id="contact-name"
            name="name"
            required
            maxLength={50}
            placeholder="怎么称呼你"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-company">企业 / 机构</Label>
          <Input
            id="contact-company"
            name="company"
            maxLength={100}
            placeholder="选填"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">联系邮箱 *</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="name@company.com"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-phone">手机号</Label>
          <Input
            id="contact-phone"
            name="phone"
            inputMode="tel"
            maxLength={30}
            placeholder="选填"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-wechat">微信号</Label>
          <Input
            id="contact-wechat"
            name="wechat"
            maxLength={80}
            placeholder="选填"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">具体内容 *</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          className="min-h-36"
          placeholder={
            type === "correction"
              ? "请说明需要更正的字段、正确内容及依据"
              : "请描述你的需求、案例线索或合作想法"
          }
        />
      </div>
      <label className="flex items-start gap-2.5 rounded-xl border bg-muted/25 p-4 text-xs leading-5">
        <Checkbox
          aria-label="同意联系信息隐私处理"
          checked={privacyConsent}
          onCheckedChange={(value) => setPrivacyConsent(value === true)}
        />
        <span>
          同意平台为回复本次请求保存和使用以上信息。我已阅读
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
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={status === "sending" || !privacyConsent}
        className="w-full sm:w-auto"
      >
        {status === "sending" ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Send />
        )}
        提交信息
      </Button>
    </form>
  );
}
