import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AssessmentWizard } from "@/components/assessment-wizard";
export const metadata: Metadata = {
  title: "企业 AI 体检",
  description:
    "用结构化问诊梳理企业 AI 改造优先级，生成带假设的 ROI 区间和三阶段建议。",
  robots: { index: false, follow: false },
};
export default function AssessmentPage() {
  return (
    <main className="container-page py-12 sm:py-16 lg:py-20">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          免费 · 约 8 分钟
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          企业 AI 体检
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          不从模型开始，从你们真正重复、耗时、容易出错的工作开始。
        </p>
      </div>
      <div className="mx-auto mb-8 flex max-w-3xl gap-3 rounded-xl border bg-card p-4 text-xs leading-6 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>问诊内容可能由 DeepSeek 处理，用于生成本次建议和完整报告。请勿填写商业秘密、身份证号、健康信息或未经授权的个人信息。提交邮箱前会再次要求确认；详情见 <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">隐私政策</Link>。</p>
      </div>
      <AssessmentWizard />
    </main>
  );
}
