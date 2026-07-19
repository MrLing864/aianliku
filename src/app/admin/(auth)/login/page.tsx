import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/dal";
export const metadata: Metadata = { title: "后台登录", robots: { index: false, follow: false } };
export default async function AdminLoginPage() { if (await getAdminSession()) redirect("/admin/dashboard"); return <main className="surface-grid grid min-h-screen place-items-center p-5"><Card className="w-full max-w-md border-border/80 bg-background/95 shadow-[0_24px_80px_-48px_rgba(8,30,26,.5)]"><CardContent className="p-7 sm:p-9"><Logo /><div className="mt-8"><h1 className="text-2xl font-semibold tracking-tight">内容运营后台</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">仅限平台管理员访问。</p></div><div className="mt-7"><AdminLoginForm /></div>{process.env.NODE_ENV !== "production" && <p className="mt-6 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">本地演示账号：admin@aianliku.local / aianliku-demo</p>}</CardContent></Card></main>; }
