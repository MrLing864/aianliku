import type { RawListItem } from "../lib/extract";
import { discoverAliyunListItems } from "../lib/aliyun";

export interface Vendor {
  id: string;
  name: string;
  listUrl: string;
  detailPathPattern?: RegExp;
  enabled: boolean;
  note?: string;
  // Custom URL discovery. If provided, overrides the regex-based discovery.
  discoverUrls?: (html: string, baseUrl: string) => Promise<string[]>;
  // Rich list-item discovery (returns metadata). Used by vendors whose list
  // page needs JS rendering (e.g. Aliyun checkbox filters).
  discoverListItems?: () => Promise<RawListItem[]>;
}

function extractAsyncData(html: string): any {
  const marker = "window['__ASYNC_DATA__'] = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = start + marker.length;
  const end = html.indexOf("</script>", jsonStart);
  if (end === -1) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end).trim());
  } catch {
    return null;
  }
}

function findEntryWithCategories(data: any): any[] | null {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object" && Array.isArray(item.categories)) {
        return data;
      }
      const found = findEntryWithCategories(item);
      if (found) return found;
    }
    return null;
  }
  for (const v of Object.values(data)) {
    const found = findEntryWithCategories(v);
    if (found) return found;
  }
  return null;
}

async function tencentDiscoverUrls(html: string, baseUrl: string): Promise<string[]> {
  const data = extractAsyncData(html);
  if (!data) return [];
  const listEntry = findEntryWithCategories(data);
  if (!listEntry || !listEntry[0]?.categories) return [];
  const cats = listEntry[0].categories;
  const urls = new Set<string>();
  for (const cat of cats) {
    for (const child of cat.children || []) {
      if (typeof child.url === "string" && child.url.startsWith("/customer/")) {
        urls.add(new URL(child.url, baseUrl).href);
      }
    }
  }
  return Array.from(urls);
}

export const vendors: Vendor[] = [
  {
    id: "tencent",
    name: "腾讯云",
    listUrl: "https://cloud.tencent.com/customer",
    enabled: true,
    discoverUrls: tencentDiscoverUrls,
  },
  {
    id: "aliyun",
    name: "阿里云",
    listUrl: "https://www.aliyun.com/customer-stories/customer-case-index",
    enabled: true,
    discoverListItems: discoverAliyunListItems,
    note: "列表筛选为客户端行为，使用 Playwright 点击「人工智能与机器学习」「AI」两个大类发现案例；详情页为 SSR，普通 fetch 即可抽取。",
  },
  {
    id: "huawei",
    name: "华为云",
    listUrl: "https://www.huaweicloud.com/cases/",
    enabled: true,
    note: "页面为 SSR，可继续扩展详情页抽取。",
  },
];
