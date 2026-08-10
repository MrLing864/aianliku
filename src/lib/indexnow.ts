import { SITE } from "@/lib/seo";

/**
 * IndexNow 通知：新案例/页面发布后主动告知 Bing / Yandex / 部分 AI 搜索产品，
 * 无需等待爬虫抓取即可被发现。
 * 文档：https://www.bing.com/indexnow
 *
 * 使用方式：
 * 1. 在根目录 public/ 下放置 <INDEXNOW_KEY>.txt，内容为该 key（已由部署脚本生成）。
 * 2. 新案例发布时调用 notifyIndexNow([url])。
 */
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function getKey(): string | null {
  const key = process.env.INDEXNOW_KEY;
  return key && key.length >= 8 ? key : null;
}

/** 发布/更新一组 URL 时调用，失败不影响主流程。 */
export async function notifyIndexNow(urls: string[]): Promise<void> {
  const key = getKey();
  if (!key || urls.length === 0) return;
  const host = (() => {
    try {
      return new URL(SITE.url).host;
    } catch {
      return "aianliku.com";
    }
  })();
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: urls,
      }),
      // 不要无限等待搜索引擎接口
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[IndexNow] 通知返回非 200: ${res.status}`, await res.text().catch(() => ""));
    } else {
      console.log(`[IndexNow] 已通知 ${urls.length} 个 URL`);
    }
  } catch (err) {
    // IndexNow 失败不应阻断发布流程
    console.warn("[IndexNow] 通知失败（已忽略）：", err instanceof Error ? err.message : err);
  }
}
