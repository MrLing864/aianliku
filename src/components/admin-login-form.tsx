"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoaderCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: data.get("email"), password: data.get("password"), redirect: false });
    if (result?.error) { setError("邮箱或密码不正确"); setLoading(false); return; }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return <form method="post" onSubmit={submit} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="admin-email">管理员邮箱</Label><Input id="admin-email" name="email" type="email" required autoComplete="username" /></div>
    <div className="space-y-2"><Label htmlFor="admin-password">密码</Label><Input id="admin-password" name="password" type="password" required minLength={8} autoComplete="current-password" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <LogIn />}登录后台</Button>
  </form>;
}
