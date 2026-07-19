import Link from "next/link";
import { ArrowRight, Check, Database, FileCheck2, Gauge, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { CaseCard } from "@/components/case-card";
import { CatalogIcon } from "@/components/icon-map";
import { DemoNotice } from "@/components/demo-notice";
import { HeroSearch } from "@/components/hero-search";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { industries, scenarios } from "@/lib/catalog";
import { getFeaturedCases, getPublicStats } from "@/lib/repositories/cases";

export default async function HomePage() {
  const [featuredCases, stats] = await Promise.all([getFeaturedCases(6), getPublicStats()]);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <div className="surface-grid absolute inset-0 -z-10 opacity-65" />
        <div className="container-page py-20 text-center sm:py-28 lg:py-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/75 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"><span className="size-1.5 rounded-full bg-primary" />中国企业 AI 改造案例数据库</div>
          <h1 className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-[76px]">企业 AI 改造，<br className="hidden sm:block" /><span className="text-primary">从案例开始。</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-8 text-muted-foreground sm:text-lg">看同行怎样解决真实问题，理解投入、路径与结果。少一点概念，多一点可以借鉴的经验。</p>
          <HeroSearch />
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm"><span className="text-xs text-muted-foreground">热门：</span>{["制造业", "外贸", "智能客服", "OCR", "知识库", "销售", "报价"].map((item) => <Link key={item} href={`/cases?q=${encodeURIComponent(item)}`} className="rounded-full border bg-background/70 px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground">{item}</Link>)}</div>
        </div>
        <div className="container-page -mb-px grid grid-cols-2 border-x border-t bg-card/90 sm:grid-cols-4">
          {[{ value: stats.cases, label: "已发布案例" }, { value: stats.industries, label: "覆盖行业" }, { value: stats.scenarios, label: "AI 场景" }, { value: stats.sources, label: "信息来源" }].map((item, index) => <div key={item.label} className={`px-5 py-5 text-center sm:py-6 ${index > 0 ? "border-l" : ""}`}><p className="metric-number text-2xl font-semibold sm:text-3xl">{item.value}<span className="ml-0.5 text-sm text-primary">+</span></p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></div>)}
        </div>
      </section>

      {stats.mode === "demo" && <div className="container-page pt-8"><DemoNotice /></div>}

      <section className="container-page py-20 lg:py-28">
        <div className="flex items-end justify-between gap-6"><SectionHeading eyebrow="精选案例" title="先看别人怎样做" description="从业务问题出发，而不是从模型和技术名词出发。" /><Button variant="outline" asChild className="hidden rounded-full sm:inline-flex"><Link href="/cases">查看全部案例<ArrowRight /></Link></Button></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featuredCases.map((item, index) => <CaseCard key={item.id} caseStudy={item} featured={index < 3} />)}</div>
        <Button variant="outline" size="lg" asChild className="mt-6 w-full rounded-full sm:hidden"><Link href="/cases">查看全部案例<ArrowRight /></Link></Button>
      </section>

      <section className="border-y bg-card/55">
        <div className="container-page py-20 lg:py-24"><SectionHeading eyebrow="按行业发现" title="找到与你更相似的企业" description="底层采用国家行业分类，前台用更易理解的方式呈现。" />
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">{industries.filter((item) => item.featured).map((item) => <Link key={item.id} href={`/industries/${item.slug}`} className="group bg-card p-5 transition-colors hover:bg-accent/60"><span className="grid size-10 place-items-center rounded-xl border bg-background text-primary"><CatalogIcon name={item.icon} className="size-5" /></span><h3 className="mt-5 font-semibold tracking-tight">{item.displayName}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">浏览案例<ArrowRight className="size-3" /></span></Link>)}</div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28"><SectionHeading eyebrow="按场景发现" title="从重复工作中找机会" description="用受控场景词表统一表达，避免标签越积越乱。" />
        <div className="mt-10 flex flex-wrap gap-3">{scenarios.filter((item) => item.featured).map((item) => <Link key={item.id} href={`/scenarios/${item.slug}`} className="group inline-flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><CatalogIcon name={item.icon} className="size-5 text-primary" /><span><span className="block text-sm font-medium">{item.name}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">查看相关案例</span></span><ArrowRight className="ml-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>)}</div>
      </section>

      <section className="container-page pb-20 lg:pb-28"><div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-10 text-background sm:px-10 lg:px-14 lg:py-14"><div className="absolute right-0 top-0 h-full w-1/2 opacity-[0.08] surface-grid" /><div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-background/15 px-3 py-1.5 text-xs text-background/70"><Sparkles className="size-3.5" />免费 · 无需注册即可开始</div><h2 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">不知道先改造哪里？<br />做一次企业 AI 体检。</h2><p className="mt-5 max-w-xl text-sm leading-7 text-background/65">用 8–12 分钟梳理行业、规模、重复工作、现有系统和数据基础，得到分阶段改造建议与带假设的 ROI 区间。</p><Button size="lg" variant="secondary" asChild className="mt-7 rounded-full px-6"><Link href="/assessment">开始免费体检<ArrowRight /></Link></Button></div><div className="grid gap-3">{[{ icon: SearchCheck, text: "结构化问诊，不绕弯" }, { icon: Gauge, text: "按影响与难度排优先级" }, { icon: FileCheck2, text: "先看结论，再决定是否留邮箱" }, { icon: ShieldCheck, text: "明确 AI 估算与事实边界" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-xl border border-background/10 bg-background/[0.055] p-4 text-sm text-background/82"><span className="grid size-8 place-items-center rounded-lg bg-background/10"><Icon className="size-4" /></span>{text}<Check className="ml-auto size-4 text-primary" /></div>)}</div></div></div></section>

      <section className="border-t"><div className="container-page grid gap-8 py-16 sm:grid-cols-3">{[{ icon: Database, title: "一项目，多来源", text: "同一真实项目合并为一条案例，多份材料共同佐证。" }, { icon: ShieldCheck, title: "事实与判断分开", text: "原文事实、AI 整理与编辑点评在页面上明确区分。" }, { icon: SearchCheck, title: "成功失败都收录", text: "不只展示宣传结果，也记录部分达成、失败与未披露。" }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl border bg-card text-primary"><Icon className="size-5" /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></section>
    </>
  );
}
