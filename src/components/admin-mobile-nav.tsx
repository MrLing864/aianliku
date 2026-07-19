"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BrainCircuit, Building2, CalendarClock, FileSearch, FileStack, Fingerprint, Gauge, Import, Menu, MessageSquareWarning, ScrollText, Settings2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard", label: "概览", icon: Gauge },
  { href: "/admin/cases", label: "案例管理", icon: FileStack },
  { href: "/admin/organizations", label: "企业与实施方", icon: Building2 },
  { href: "/admin/sources", label: "来源管理", icon: FileSearch },
  { href: "/admin/imports", label: "批量导入", icon: Import },
  { href: "/admin/duplicates", label: "重复审核", icon: Fingerprint },
  { href: "/admin/assessments", label: "AI 体检报告", icon: BrainCircuit },
  { href: "/admin/appointments", label: "专家预约", icon: CalendarClock },
  { href: "/admin/corrections", label: "内容更正", icon: MessageSquareWarning },
  { href: "/admin/taxonomies", label: "分类词表", icon: Tags },
  { href: "/admin/analytics", label: "SEO 与数据", icon: BarChart3 },
  { href: "/admin/audit", label: "操作日志", icon: ScrollText },
  { href: "/admin/settings", label: "系统设置", icon: Settings2 },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="打开后台导航"><Menu /></Button></SheetTrigger>
      <SheetContent side="left" className="w-[82vw] max-w-xs">
        <SheetHeader><SheetTitle>运营后台</SheetTitle></SheetHeader>
        <nav className="max-h-[calc(100vh-6rem)] space-y-1 overflow-y-auto px-3 pb-6">
          {nav.map(({ href, label, icon: Icon }) => (
            <Button key={href} variant="ghost" asChild className={cn("w-full justify-start", pathname.startsWith(href) && "bg-primary/10 text-primary")}>
              <Link href={href}><Icon />{label}</Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
