import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Logo } from "@/components/logo";

const links = {
  发现: [{ href: "/cases", label: "全部案例" }, { href: "/industries/manufacturing", label: "热门行业" }, { href: "/scenarios/knowledge-base", label: "热门场景" }],
  产品: [{ href: "/assessment", label: "AI 企业体检" }, { href: "/about", label: "关于我们" }, { href: "/contact", label: "联系我们" }],
  规则: [{ href: "/privacy", label: "隐私政策" }, { href: "/terms", label: "使用条款" }, { href: "/contact?type=correction", label: "内容更正" }],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/45">
      <div className="container-page py-14 lg:py-18">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div><Logo /><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">中国企业 AI 改造案例数据库。把公开材料整理成可比较、可追溯、能辅助决策的案例。</p><a href="mailto:hello@aianliku.cn" className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:text-primary"><Mail className="size-4" />hello@aianliku.cn</a></div>
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(links).map(([group, items]) => <div key={group}><p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group}</p><ul className="space-y-3">{items.map((item) => <li key={item.href}><Link href={item.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}{item.href.startsWith("http") && <ArrowUpRight className="size-3" />}</Link></li>)}</ul></div>)}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>© 2026 AI案例库 · 内容用于前期机会判断</p><p>AI 辅助整理内容均经人工审核后发布</p></div>
      </div>
    </footer>
  );
}
