import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI案例库";

const BRAND = "#0f4b41";
const INK = "#0b1413";

/** 加载中文字体，避免无中文字体的运行环境（如 Linux 服务器）渲染方块。 */
async function loadFont(): Promise<ArrayBuffer> {
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700;800&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  );
  const css = await cssRes.text();
  const urlMatch = css.match(/src: url\((https:\/\/[^)]+\.woff2)\)/);
  if (!urlMatch) throw new Error("未能解析中文字体地址");
  const fontRes = await fetch(urlMatch[1]);
  return await fontRes.arrayBuffer();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "中国企业 AI 改造案例库").slice(0, 48);
  const subtitle = (searchParams.get("subtitle") ?? "看真实案例，做更好的 AI 改造决策").slice(0, 64);
  const kind = searchParams.get("kind") ?? "site";

  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 600 | 700 | 800; style: "normal" }[] = [];
  try {
    const data = await loadFont();
    fonts = [{ name: "Noto Sans SC", data, weight: 400, style: "normal" }];
  } catch {
    // 字体加载失败时回退系统字体
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #f8f8f3 0%, #eef3f0 100%)",
          fontFamily: fonts.length ? '"Noto Sans SC", sans-serif' : "sans-serif",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: BRAND }}>AI案例库</div>
          {kind !== "site" && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: 22,
                fontWeight: 600,
                color: BRAND,
                border: `1px solid ${BRAND}`,
                borderRadius: 999,
                padding: "6px 20px",
              }}
            >
              {kind === "case" ? "实践案例" : kind === "industry" ? "行业专题" : "场景专题"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, color: INK, maxWidth: 1040 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#44534f", lineHeight: 1.4, maxWidth: 980 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, color: "#6b7a75" }}>
          <div>aianliku.com · 真实、可追溯的企业 AI 案例</div>
          <div style={{ color: BRAND, fontWeight: 600 }}>自动报价 · 自动客服 · AI知识助手</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
