import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
export const metadata: Metadata = { title: { default: "运营后台", template: "%s｜AI案例库后台" }, robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const session = await requireAdmin(); return <div className="min-h-screen bg-muted/25 lg:flex"><AdminSidebar /><div className="min-w-0 flex-1"><header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b bg-background/92 px-4 backdrop-blur sm:px-6"><AdminMobileNav /><div className="hidden text-sm lg:block"><span className="text-muted-foreground">当前管理员：</span>{session.user?.email}</div><Button variant="outline" size="sm" asChild><Link href="/" target="_blank">查看网站<ExternalLink /></Link></Button></header><main className="p-4 sm:p-6 lg:p-8">{children}</main></div></div>; }
