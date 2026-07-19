"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BrainCircuit,
  CalendarClock,
  FileStack,
  Fingerprint,
  Gauge,
  Import,
  LogOut,
  Settings2,
  Tags,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard", label: "概览", icon: Gauge },
  { href: "/admin/cases", label: "案例管理", icon: FileStack },
  { href: "/admin/imports", label: "批量导入", icon: Import },
  { href: "/admin/duplicates", label: "重复审核", icon: Fingerprint },
  { href: "/admin/assessments", label: "AI 体检报告", icon: BrainCircuit },
  { href: "/admin/appointments", label: "专家预约", icon: CalendarClock },
  { href: "/admin/taxonomies", label: "分类词表", icon: Tags },
  { href: "/admin/settings", label: "系统设置", icon: Settings2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-[68px] items-center border-b px-5"><Logo /></div>
      <nav className="flex-1 space-y-1 p-3" aria-label="后台导航">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", pathname.startsWith(href) && "bg-primary/10 font-medium text-primary")}>
            <Icon className="size-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut />退出登录
        </Button>
      </div>
    </aside>
  );
}
