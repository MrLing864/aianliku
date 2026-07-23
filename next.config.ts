import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: { root: process.cwd() },
  // 原生模块（N-API 二进制）必须保持外部化，否则 Next 打包时会被内联，
  // 在 EdgeOne Pages 运行时找不到 .node 二进制，导致 /admin 整模块图 500。
  serverExternalPackages: ["@node-rs/argon2"],
  async headers() {
    const privateHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ] },
      { source: "/reports/:path*", headers: privateHeaders },
      { source: "/assessment/status/:path*", headers: privateHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
