import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
export const getAdminSession = cache(async () => { const session = await auth(); return session?.user?.role === "admin" ? session : null; });
export const requireAdmin = cache(async () => { const session = await getAdminSession(); if (!session) redirect("/admin/login"); return session; });
export async function isAdminRequest() { return Boolean(await getAdminSession()); }
