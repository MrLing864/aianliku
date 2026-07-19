import type { Metadata } from "next";
import { AssessmentWizard } from "@/components/assessment-wizard";
export const metadata: Metadata = { title: "企业 AI 体检", description: "用结构化问诊梳理企业 AI 改造优先级，生成带假设的 ROI 区间和三阶段建议。", robots: { index: false, follow: false } };
export default function AssessmentPage() { return <main className="container-page py-12 sm:py-16 lg:py-20"><div className="mb-10 text-center"><p className="text-xs font-semibold tracking-[0.16em] text-primary">免费 · 约 8 分钟</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">企业 AI 体检</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">不从模型开始，从你们真正重复、耗时、容易出错的工作开始。</p></div><AssessmentWizard /></main>; }
