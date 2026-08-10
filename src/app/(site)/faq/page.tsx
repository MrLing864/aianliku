import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "企业 AI 改造常见问题",
  description: "企业做 AI 改造要花多少钱？自动客服、自动报价、知识库怎么落地？看真实案例与可量化结果，回答 ROI、周期、选型等高频问题。",
  path: "/faq",
});

const faqs = [
  {
    q: "企业做 AI 改造一般要花多少钱？",
    a: "差异很大，取决于场景与自研比例。轻量的自动客服、知识库类项目通常以 SaaS 订阅或少量开发为主，月度成本从几千元起步；涉及定制模型、系统集成或多部门打通的项目投入更高。建议先用单一高频场景做试点，用本站的真实案例对照同行的投入区间。",
  },
  {
    q: "自动客服、自动报价、AI 知识助手哪个最容易先见效？",
    a: "通常“AI 知识助手 / 知识库问答”和“自动客服”落地最快，因为数据来自企业既有文档，实施周期短、可量化指标明确（如人工工时下降、首次响应时长缩短）。自动报价则需要打通产品、价格与审批流程，周期更长但价值更高。",
  },
  {
    q: "小企业也适合做 AI 改造吗？",
    a: "适合。本站收录大量中小企业案例，不少场景用现成的云服务和低代码即可落地，不必自建模型团队。关键是选对高频、规则相对清晰、数据已沉淀的场景。",
  },
  {
    q: "怎么判断一个 AI 改造项目是否成功？",
    a: "看可量化结果：处理时长、人工成本、转化率、错误率、客户满意度等。本站每个案例都尽量呈现投入、路径与结果，方便你对照设置自己的成功指标（KPI）。",
  },
  {
    q: "数据安全和合规怎么处理？",
    a: "优先选择支持私有化或企业级权限隔离的方案，敏感数据做脱敏与访问控制。本站内容遵循“可引用、可验证”原则，案例中的企业信息均来自公开披露。",
  },
  {
    q: "从哪里开始规划我们公司的 AI 改造？",
    a: "建议先用本站按行业、按场景浏览同行案例，找到与自身业务最相近的实践，再从中挑选一个投入可控的试点场景。也可以提交需求，我们协助梳理改造机会与 ROI。",
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <main className="container-page py-14 lg:py-20">
      <JsonLd data={faqJsonLd} />
      <SectionHeading
        eyebrow="常见问题"
        title="企业 AI 改造，先搞懂这些"
        description="围绕成本、落地路径、ROI 与合规的高频问题，结合真实案例给出可对照的回答。"
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-border/70 bg-card/70 p-6 open:shadow-sm"
            open
          >
            <summary className="cursor-pointer list-none text-base font-semibold tracking-tight text-ink">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        想看具体行业的落地方式？回到 <Link className="text-primary underline-offset-4 hover:underline" href="/cases">全部案例</Link> 按行业或场景检索。
      </p>
    </main>
  );
}
