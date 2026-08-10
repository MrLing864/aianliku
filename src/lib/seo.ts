import type { Metadata } from "next";
import type { Industry, Scenario } from "@/lib/types";

/** 站点级 SEO 常量，单一信息源，避免各处硬编码。 */
export const SITE = {
  name: "AI案例库",
  domain: "aianliku.com",
  /** 用于 sitemap / canonical / og 的绝对站点地址 */
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://aianliku.com",
  cnDomain: "aianliku.cn",
  email: "hello@aianliku.cn",
  twitter: "@aianliku",
  locale: "zh_CN",
  /** 默认社交分享图：动态 /og 路由（无需静态 PNG 资源） */
  ogImage: "/og?title=AI案例库&subtitle=中国企业AI改造真实案例库&kind=site",
  description:
    "AI案例库整理中国企业在自动报价、自动客服、自动录单、AI知识助手等场景的真实落地案例。按行业与AI场景检索，辅助你判断AI改造机会与ROI。",
} as const;

/** 拼接绝对地址 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** 所有页面共用的基础 metadata（title 模板、openGraph、twitter、robots） */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · 中国企业 AI 改造真实案例库`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: { canonical: SITE.url },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} · 中国企业 AI 改造真实案例库`,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} · 中国企业 AI 改造真实案例库`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
};

/** 拼接动态 OG 图地址（路由 /og 由 ImageResponse 渲染） */
export function ogImageUrl(opts: { title: string; subtitle?: string; kind?: "site" | "case" | "industry" | "scenario" }): string {
  const params = new URLSearchParams();
  params.set("title", opts.title);
  if (opts.subtitle) params.set("subtitle", opts.subtitle);
  if (opts.kind) params.set("kind", opts.kind);
  return `/og?${params.toString()}`;
}

/** 生成单页 metadata 的便捷工厂（自动补 canonical / OG / Twitter） */
export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  images?: string[];
  noIndex?: boolean;
  og?: { title: string; subtitle?: string; kind?: "site" | "case" | "industry" | "scenario" };
}): Metadata {
  const url = absoluteUrl(opts.path);
  const ogImages = opts.images?.length
    ? opts.images
    : opts.og
      ? [ogImageUrl(opts.og)]
      : [SITE.ogImage];
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: opts.type ?? "website",
      url,
      title: opts.title,
      description: opts.description,
      siteName: SITE.name,
      locale: SITE.locale,
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
      images: ogImages.map((u) => ({
        url: u,
        width: 1200,
        height: 630,
        alt: opts.title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: ogImages,
    },
  };
}

/** Organization 结构化数据（放在根 layout） */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon.svg"),
    email: SITE.email,
    sameAs: [absoluteUrl(""), `https://${SITE.cnDomain}`],
    description: SITE.description,
  };
}

/** WebSite + SearchAction 结构化数据（启用站内搜索富媒体结果） */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/cases?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** 面包屑结构化数据 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

/** 案例详情 Article 结构化数据 */
export function articleJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  publishedTime: string;
  modifiedTime: string;
  image?: string;
  industry?: Industry;
  scenario?: Scenario;
  keywords?: string[];
}) {
  const url = absoluteUrl(`/cases/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: input.image ? [input.image] : [SITE.ogImage],
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    keywords: input.keywords?.join(", "),
    about: [
      input.industry ? { "@type": "Thing", name: input.industry.displayName } : null,
      input.scenario ? { "@type": "Thing", name: input.scenario.name } : null,
    ].filter(Boolean),
  };
}

/** 行业 / 场景聚合页 CollectionPage 结构化数据 */
export function collectionJsonLd(input: {
  name: string;
  description: string;
  url: string;
  count: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.count,
    },
  };
}
