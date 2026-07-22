import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: "AI案例库｜中国企业 AI 改造案例数据库", template: "%s｜AI案例库" },
  description: "用真实、可追溯的企业 AI 案例，帮助企业看案例、找方向、做 AI。",
  keywords: ["AI案例", "企业AI", "人工智能案例", "AI改造", "AI企业体检"],
  authors: [{ name: "AI案例库" }],
  creator: "AI案例库",
  openGraph: { type: "website", locale: "zh_CN", siteName: "AI案例库", title: "AI案例库", description: "企业 AI 改造，从案例开始。" },
  twitter: { card: "summary_large_image", title: "AI案例库", description: "企业 AI 改造，从案例开始。" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { colorScheme: "light dark", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f8f3" }, { media: "(prefers-color-scheme: dark)", color: "#12191b" }] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
