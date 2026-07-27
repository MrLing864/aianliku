import { stripHtml } from "./fetch";
import type { RawListItem } from "./extract";

/**
 * 阿里云客户案例采集辅助模块。
 *
 * 阿里云案例索引页（customer-case-index）的分类筛选是纯客户端行为：
 * 左侧分类是复选框，必须点击其隐藏的 <input class="ace-checkbox-input"> 才会触发 React 过滤
 * （点击 label/文字本身无效）。过滤后的真实结果位于 `.ace-customer-case-index-list-result-content` 容器，
 * 另外页面还有 3 个固定的「精选」卡片（`.card-text-content-box`，任何筛选下都显示），需要一并采集。
 * 详情页为服务端渲染（SSR），普通 fetch 即可取到完整正文。
 */

const INDEX_URL = "https://www.aliyun.com/customer-stories/customer-case-index";

/** 需要采集的两个 AI 相关大类（用户指定）。 */
const TARGET_FILTERS = ["人工智能与机器学习", "AI"];

/** 公司名常见后缀，用于提升候选评分。 */
const COMPANY_SUFFIX = [
  "科技", "集团", "汽车", "软件", "出版社", "银行", "网络", "数据", "传媒",
  "影视", "信息", "股份", "公司", "数科", "通讯", "电子", "生物", "医药", "能源",
  "制造", "工业", "控股", "实业", "技术",
];

/** 阿里云的产品 / 技术词，出现则说明该候选不是公司名。 */
const PRODUCT_WORDS = [
  "阿里云", "阿里", "通义", "百炼", "千问", "PAI", "MaxCompute", "Qoder", "Serverless", "无影",
  "晓蜜", "STAROps", "大模型", "平台", "系统", "AI", "数字员工", "解决方案",
  "算力", "成本", "商品识别", "剧本", "内容", "工程", "天探", "智能体", "云电脑",
  "灵骏", "智算", "网关", "函数计算", "FC", "Funart", "CPFS", "DeepGPU", "Data", "引擎",
];

const CONNECTOR_WORDS = [
  "助力", "携手", "联合", "基于", "借助", "使用", "通过", "利用", "依托", "深耕", "让",
  "实现", "完成", "打造", "构建", "推出", "上线", "落地", "开启", "升级", "转型",
  "探索", "共创", "赋能", "合作",
];

/** 公司名之后的「停止词」：遇到这些即认为公司名已结束。 */
const STOP =
  "(?:助力|携手|联合|基于|借助|使用|通过|利用|依托|深耕|让|实现|完成|打造|构建|推出|" +
  "上线|落地|开启|升级|转型|探索|共创|赋能|合作|在|为|中|是|以|用|将|的|了|" +
  "\\s|，|,|。|：|:|;|、|；|（|）|\\(|\\)|\\[|「|\"|'|大模型|平台|系统|AI|业务|快速|" +
  "方案|场景|能力|服务|应用|技术|大幅|提升|效率|引擎|数据)";

function candidateScore(c: string): number {
  if (!c) return -1;
  if (/[，,。：:；、\s（(「]/.test(c)) return -1;
  if (PRODUCT_WORDS.some((p) => c.includes(p))) return -1;
  let s = 0;
  if (COMPANY_SUFFIX.some((suf) => c.endsWith(suf))) s += 5;
  if (/^[\u4e00-\u9fa5]+$/.test(c)) {
    if (c.length >= 2 && c.length <= 10) s += 3;
    if (c.length > 12) s -= 3;
  }
  if (/^[A-Za-z][A-Za-z0-9+]*$/.test(c)) s += 4;
  return s;
}

/** 若候选超出公司名（含产品/连接词后缀），按最后一个公司后缀裁剪。 */
function trimToCompany(c: string): string {
  let cut = -1;
  for (const suf of COMPANY_SUFFIX) {
    const i = c.lastIndexOf(suf);
    if (i > -1) cut = Math.max(cut, i + suf.length);
  }
  return cut > 0 && cut < c.length ? c.slice(0, cut) : c;
}

/** 核心抽取：生成候选 + 评分选最优（见 companyFromH1）。 */
function extractCompany(h1: string): string {
  const s = (h1 || "").trim();
  if (!s) return "";
  let work = s.replace(/^阿里云\s*(携手|助力|联合|与)?\s*/, "");
  work = work.replace(/^(助力|助|联合|携手)\s*/, "");

  const cands: string[] = [];

  // (a) 句首到第一个停止词
  const aM = work.match(new RegExp("^([\u4e00-\u9fa5A-Za-z0-9+]{2,16}?)(?=" + STOP + ")"));
  if (aM) cands.push(aM[1]);

  // (b) 连接词之后的中文 / 英文段
  for (const conn of CONNECTOR_WORDS) {
    const cjk = work.match(new RegExp(conn + "\\s*([\u4e00-\u9fa5]{2,12}?)(?=" + STOP + ")"));
    if (cjk) cands.push(cjk[1]);
    const en = work.match(new RegExp(conn + "\\s*([A-Za-z][A-Za-z0-9+]{1,16}?)(?=" + STOP + ")"));
    if (en && !cands.some((c) => c.includes(en[1]))) cands.push(en[1]);
  }

  // (c) 逗号之后、下一个停止词之前
  const cM = work.match(new RegExp("[，,]\\s*([\u4e00-\u9fa5]{2,12}?)(?=" + STOP + ")"));
  if (cM) cands.push(cM[1]);

  let best = "";
  let bestScore = -1;
  for (const raw of cands) {
    const c = trimToCompany(raw);
    const sc = candidateScore(c);
    if (sc > bestScore) {
      bestScore = sc;
      best = c;
    }
  }
  return best;
}

/**
 * 从详情页 h1（以及可选的案例标题）中稳健地提取公司名。
 * 阿里云 h1 的公司名位置不固定：句首（亚信科技借助…）、「阿里云+连接词」之后
 * （阿里云携手 MiniMax…）、逗号之后（…贝斯平大幅提升…）都可能。
 * 若标题中包含更完整的公司名（如 h1 为「微财使用…」、标题为「微财数科借助…」），
 * 则优先采用更完整的那个。
 */
export function companyFromH1(h1: string, title?: string): string {
  const fromH1 = extractCompany(h1);
  if (title && title !== h1) {
    const fromTitle = extractCompany(title);
    if (fromTitle && fromH1) {
      if (fromTitle.startsWith(fromH1) && fromTitle.length > fromH1.length) return fromTitle;
    } else if (fromTitle) {
      return fromTitle;
    }
  }
  return fromH1;
}

async function clickFilterInput(page: import("playwright").Page, text: string): Promise<boolean> {
  const handle = await page.evaluateHandle((txt) => {
    const all = Array.from(document.querySelectorAll("*"));
    for (const e of all) {
      if ((e.textContent || "").trim() === txt) {
        const input = (e as HTMLElement).querySelector?.("input.ace-checkbox-input") as HTMLInputElement | null;
        if (input) return input;
        const pin = e.closest("label")?.querySelector("input.ace-checkbox-input") as HTMLInputElement | null;
        if (pin) return pin;
      }
    }
    return null;
  }, text);
  const el = handle.asElement();
  if (!el) {
    console.warn(`[aliyun-discover] 未找到筛选器 input: ${text}`);
    return false;
  }
  try {
    await el.click({ timeout: 4000, force: true });
    return true;
  } catch (e: any) {
    console.warn(`[aliyun-discover] 点击筛选器失败 ${text}: ${e.message}`);
    return false;
  }
}

interface CardInfo {
  companyName: string;
  title: string;
  summary: string;
  url: string;
}

async function collectFeaturedCards(page: import("playwright").Page): Promise<CardInfo[]> {
  return await page.$$eval(".card-text-content-box", (els) =>
    els.map((card) => {
      const titleEl = card.querySelector(".card-title");
      const descEl = card.querySelector(".card-desc");
      const a = card.querySelector("a.jump-link") || card.querySelector("a");
      return {
        companyName: titleEl?.getAttribute("title") || titleEl?.textContent?.trim() || "",
        title: "",
        summary: descEl?.getAttribute("title") || descEl?.textContent?.trim() || "",
        url: a?.getAttribute("href") || "",
      };
    }),
  );
}

async function collectResultCards(page: import("playwright").Page): Promise<CardInfo[]> {
  return await page.$$eval(".ace-customer-case-index-list-result-content", (els) =>
    els.map((card) => {
      const titleEl = card.querySelector(".title");
      const overviewEl = card.querySelector(".overview");
      const nameEl = card.querySelector(".name");
      const a = card.querySelector(".link a") || card.querySelector("a");
      const titleText = titleEl?.textContent?.trim() || "";
      return {
        companyName: nameEl?.textContent?.trim() || "",
        title: titleText,
        summary: overviewEl?.textContent?.trim() || "",
        url: a?.getAttribute("href") || "",
      };
    }),
  );
}

/**
 * 通过 Playwright 点击两个 AI 分类筛选器的隐藏 input，从筛选结果网格 + 精选块中提取案例列表。
 * 返回去重后的 RawListItem。
 */
export async function discoverAliyunListItems(): Promise<RawListItem[]> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  const byUrl = new Map<string, RawListItem>();

  const addCard = (c: CardInfo) => {
    if (!c.url) return;
    const abs = c.url.startsWith("http") ? c.url : `https://www.aliyun.com${c.url}`;
    const existing = byUrl.get(abs);
    if (existing) {
      // 精选块可能已提供 companyName；结果块可能已提供 title。互补填充。
      existing.companyName = existing.companyName || c.companyName;
      existing.title = existing.title || c.title;
      existing.summary = existing.summary || c.summary;
      return;
    }
    byUrl.set(abs, {
      sourceUrl: abs,
      companyName: c.companyName,
      title: c.title,
      rawIndustry: "",
      summary: c.summary,
    });
  };

  try {
    for (const filter of TARGET_FILTERS) {
      // 每次重新加载，保证筛选器互相独立（复选框不会累积）
      await page.goto(INDEX_URL, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(2000);

      const ok = await clickFilterInput(page, filter);
      if (!ok) console.warn(`[aliyun-discover] 筛选器点击失败: ${filter}`);
      await page.waitForTimeout(2500);

      // 卡片可能懒加载（滚动 / “加载更多”），循环抓取直到稳定
      let stable = 0;
      for (let i = 0; i < 20; i++) {
        const featured = await collectFeaturedCards(page);
        const results = await collectResultCards(page);
        const before = byUrl.size;
        [...featured, ...results].forEach(addCard);
        const added = byUrl.size - before;

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        let clicked = false;
        for (const h of await page.$$("button, a")) {
          const t = (await h.textContent())?.trim() || "";
          if (/加载更多|查看更多|下一页|加载更多案例/.test(t)) {
            try {
              await h.click({ timeout: 3000 });
              clicked = true;
              break;
            } catch {
              /* ignore */
            }
          }
        }
        if (clicked) await page.waitForTimeout(1000);

        if (added === 0 && !clicked) {
          stable++;
          if (stable >= 2) break;
        } else {
          stable = 0;
        }
      }
      console.log(`[aliyun-discover] 分类「${filter}」累计去重卡片: ${byUrl.size}`);
    }
  } finally {
    await browser.close();
  }

  return [...byUrl.values()];
}

/** 从详情页提取结构化正文文本（从 h1 到页脚之间）。 */
export function extractAliyunDetailText(html: string): string {
  let region = html;
  const h1Idx = html.indexOf("<h1");
  if (h1Idx > -1) region = html.slice(h1Idx);
  const cut = region.search(/<footer|关于阿里云|法律声明|联系我们|备案号|友情链接|网站地图/);
  if (cut > -1) region = region.slice(0, cut);
  return stripHtml(region);
}

/** 从详情页提取案例标题(h1)、行业（来自 <title> 的第二个分段）与公司名（来自 h1 + 标题）。 */
export function extractAliyunMeta(html: string, title?: string): { title: string; rawIndustry?: string; companyName?: string } {
  const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1m ? stripHtml(h1m[1]) : "";
  const resolvedTitle = h1 || title || "";

  let rawIndustry: string | undefined;
  const tm = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (tm) {
    const parts = tm[1].split("_");
    if (parts.length >= 2) rawIndustry = parts[parts.length - 2].trim();
  }

  const companyName = resolvedTitle ? companyFromH1(resolvedTitle, title) || undefined : undefined;

  return { title: resolvedTitle, rawIndustry, companyName };
}
