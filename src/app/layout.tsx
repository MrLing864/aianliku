import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd } from "@/components/json-ld";
import { baseMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = { colorScheme: "light dark", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f8f3" }, { media: "(prefers-color-scheme: dark)", color: "#12191b" }] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="baidu-site-verification" content="codeva-KRV86X3w7R" />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body className="min-h-screen">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
