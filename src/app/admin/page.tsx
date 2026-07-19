import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/dal";
export default async function AdminIndex() { redirect((await getAdminSession()) ? "/admin/dashboard" : "/admin/login"); }
