import { generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import dotenv from "dotenv";
import { industries, scenarios } from "../../src/lib/catalog";

dotenv.config();

function getModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置");
  }
  const deepseek = createDeepSeek({ apiKey });
  return deepseek("deepseek-chat");
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

function findCustomerEntry(data: any): any | null {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findCustomerEntry(item);
      if (found) return found;
    }
    return null;
  }
  if (data.customer && data.customer.page?.chunks) {
    return data.customer;
  }
  for (const v of Object.values(data)) {
    const found = findCustomerEntry(v);
    if (found) return found;
  }
  return null;
}

function extractBlocksText(blockMap: any): string {
  if (!blockMap || typeof blockMap !== "object") return "";
  const parts: string[] = [];
  for (const block of Object.values(blockMap) as any[]) {
    const raw = block?.data?.content?.raw;
    if (raw?.blocks && Array.isArray(raw.blocks)) {
      for (const b of raw.blocks) {
        if (b.text) parts.push(b.text);
      }
    }
    const list = block?.data?.list;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item.name) parts.push(`产品/服务：${item.name} ${item.abstract || ""}`);
      }
    }
    const title = block?.data?.title;
    if (title) parts.push(title);
  }
  return parts.join("\n").trim();
}

export function extractCustomerDetailText(html: string): string {
  const data = extractAsyncData(html);
  if (!data) return "";
  const customer = findCustomerEntry(data);
  if (!customer) return "";
  const parts: string[] = [];
  parts.push(`企业名称：${customer.name || ""}`);
  parts.push(`类型：${customer.type || ""}`);
  parts.push(`简介：${customer.abstract || ""}`);
  if (customer.description) parts.push(customer.description);
  const chunks = customer.page?.chunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      const text = extractBlocksText(chunk?.data?.content?.blockMap);
      if (text) parts.push(text);
    }
  }
  if (Array.isArray(customer.products)) {
    for (const p of customer.products) {
      parts.push(`使用产品：${p.name} ${p.abstract || ""}`);
    }
  }
  return parts.join("\n").trim();
}

export interface RawListItem {
  sourceUrl: string;
  companyName: string;
  title?: string;
  rawIndustry?: string;
  summary?: string;
}

export function extractTencentList(html: string, baseUrl: string): RawListItem[] {
  const data = extractAsyncData(html);
  if (!data) return [];
  const listEntry = findEntryWithCategories(data);
  if (!listEntry || !listEntry[0]?.categories) return [];
  const cats = listEntry[0].categories;
  const items: RawListItem[] = [];
  for (const cat of cats) {
    const industryName = cat.name || "";
    for (const child of cat.children || []) {
      if (typeof child.url === "string" && child.url.startsWith("/customer/")) {
        items.push({
          sourceUrl: new URL(child.url, baseUrl).href,
          companyName: child.name || child.customerName || "",
          title: child.title || child.name || "",
          rawIndustry: industryName,
          summary: child.abstract || "",
        });
      }
    }
  }
  return items;
}

const extractedCaseSchema = z.object({
  isAICase: z.boolean().describe("是否属于 AI 应用案例。必须明确使用 AI/大模型/机器学习/计算机视觉/NLP/生成式 AI/OCR/智能推荐/知识库问答/RPA+AI 等。仅使用云服务器、数据库、CDN、DDoS、短信、负载均衡、对象存储、容器、Kafka、Redis、普通大数据平台、广告、建站等通用云服务或工具，应判为 false。"),
  aiRelevanceReason: z.string().describe("判断理由"),
  title: z.string().describe("改写后的案例标题"),
  summary: z.string().describe("改写后的一句话摘要，不超过100字"),
  industrySlug: z.string().describe("行业标识。尽量从 catalog 选项中选择；若无法匹配，填写最接近的中文行业名"),
  scenarioSlugs: z.array(z.string()).describe("业务场景标识列表。尽量从 catalog 选项中选择；若无法匹配，可填写最接近的中文场景名"),
  functions: z.array(z.string()).describe("业务职能，中文，可选：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理"),
  background: z.string().describe("客户背景与业务现状，改写后，不超过300字"),
  problem: z.string().describe("面临的核心问题与挑战，改写后，不超过400字"),
  solution: z.string().describe("AI 解决方案与实施路径，改写后，不超过600字"),
  implementationSteps: z.array(z.string()).describe("实施步骤，最多6条"),
  results: z.array(z.string()).describe("业务效果与量化成果，最多6条"),
  roi: z.string().describe("投资回报/价值总结，改写后，不超过100字"),
  risks: z.string().describe("潜在风险与注意点，改写后，不超过200字"),
  editorComment: z.object({
    suitableFor: z.array(z.string()).describe("适合什么样的企业"),
    prerequisites: z.array(z.string()).describe("落地前提条件"),
    priority: z.string().describe("推荐优先级：high / medium / low"),
    text: z.string().describe("编辑点评，改写后，不超过200字"),
  }),
  modelStack: z.array(z.string()).describe("使用的 AI 模型/算法/平台，最多8条"),
  techPath: z.array(z.string()).describe("技术路线/腾讯云产品，最多8条"),
  tags: z.array(z.string()).describe("标签，最多12条"),
  confidence: z.string().describe("信息完整度与可信度：high / medium / pending"),
  outcomeStatus: z.string().describe("项目结果：success / partial / failure / undisclosed"),
  implementedAt: z.string().describe("项目实施年份（项目实际落地的年份，可能与发布年份不同）。若来源只给了一个年份且无明确实施时间，填空字符串，禁止编造。例如 '2024' 或 ''。"),
});

export type ExtractedCase = z.infer<typeof extractedCaseSchema>;

function buildPrompt(detailText: string, raw: RawListItem, vendorName = "腾讯云"): string {
  const industryOptions = industries.map((i) => `${i.slug}(${i.name})`).join(", ");
  const scenarioOptions = scenarios.map((s) => `${s.slug}(${s.name})`).join(", ");
  return `你是一位企业 AI 案例研究分析师。请根据以下${vendorName}客户案例原文，提取并改写为一个结构化的案例。

要求：
1. **必须改写，不能原版照抄**。用自己的语言重新组织：替换同义词、调整句式、概括要点、合并/拆分句子。保留核心事实（企业、技术、效果、产品），但表达方式必须原创，以避免侵权。
2. **严格判断 AI 相关性**：只有案例明确使用了 AI/大模型/机器学习/计算机视觉/NLP/生成式 AI/OCR/智能推荐/知识库问答/RPA+AI 等，isAICase 才为 true。如果只是使用云服务器、数据库、CDN、DDoS、短信、负载均衡、对象存储、容器、Kafka、Redis、普通大数据平台、广告投放、建站等通用云服务或工具，isAICase 必须为 false。
3. **字段取值限制**：
   - industrySlug 必须从以下选项中选择：${industryOptions}
   - scenarioSlugs 必须从以下选项中选择：${scenarioOptions}
   - functions 必须是中文：生产、质检、销售、客服、采购、供应链、财务、人力、研发、经营管理 中匹配项
4. 如果原文信息不足，相关字段可以合理概括，但不得编造具体数字。quantitative metrics 请放到 results 中作为文本描述。

原始信息：
企业名称：${raw.companyName}
行业：${raw.rawIndustry}
摘要：${raw.summary}

详情原文（节选）：
${detailText.slice(0, 12000)}

请直接输出 JSON，不要输出 markdown 代码块外的任何内容。`;
}

const aiRelevanceSchema = z.object({
  isAICase: z.boolean().describe("是否属于 AI 应用案例。必须明确使用 AI/大模型/机器学习/计算机视觉/NLP/生成式 AI/OCR/智能推荐/知识库问答/RPA+AI 等。仅使用云服务器、数据库、CDN、DDoS、短信、负载均衡、对象存储、容器、Kafka、Redis、普通大数据平台、广告、建站等通用云服务或工具，应判为 false。"),
  aiRelevanceReason: z.string().describe("判断理由，不超过80字"),
});

export async function classifyAICase(raw: RawListItem, detailText: string, vendorName = "腾讯云"): Promise<{ isAICase: boolean; aiRelevanceReason: string } | null> {
  const prompt = `判断以下${vendorName}客户案例是否属于 AI 应用案例。请严格判断。

**不属于 AI 案例的情况（isAICase 必须为 false）：**
- 仅使用云服务器、云数据库、CDN、DDoS 防护、负载均衡、对象存储、容器、消息队列、Redis、Kafka 等通用云服务。
- 仅使用企业微信、腾讯会议、腾讯企点客服等通用办公/客服 SaaS，没有结合 AI 能力。
- 仅使用大数据平台、数据中台、BI、IoT 平台、工业互联网平台，但没有明确使用 AI/机器学习模型进行预测、识别、推荐、生成等智能任务。
- 直播平台、视频点播、短视频平台，仅使用云基础能力保障高并发和稳定性。
- 仅使用低代码平台、电子签名、在线审批、移动应用、建站等通用数字化工具。
- 仅在文案中泛泛提到“人工智能”“AI”“智能化”等词汇，但没有具体的 AI 技术、模型或算法落地。

**属于 AI 案例的情况（isAICase 为 true）：**
明确使用了大语言模型、机器学习、计算机视觉、OCR、人脸识别、语音识别、NLP、智能推荐、生成式 AI、知识图谱、AI Agent、RPA+AI、AI 质检、AI 客服机器人、AI 内容审核、AI 预测性维护等具体 AI 技术之一。

企业名称：${raw.companyName}
行业：${raw.rawIndustry}
摘要：${raw.summary}

详情原文（节选）：
${detailText.slice(0, 6000)}

请直接输出 JSON。`;

  try {
    const { output } = await generateText({
      model: getModel(),
      prompt,
      output: Output.object({ schema: aiRelevanceSchema }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: 1_000,
      abortSignal: AbortSignal.timeout(60_000),
    });
    return output as { isAICase: boolean; aiRelevanceReason: string };
  } catch (err: any) {
    console.error(`[extract] AI 相关性判断失败 ${raw.sourceUrl}:`, err.message || err);
    return null;
  }
}

export async function extractCaseDetail(raw: RawListItem, detailText: string, vendorName = "腾讯云"): Promise<ExtractedCase | null> {
  if (!detailText) {
    console.warn(`[extract] 无法从详情页提取文本: ${raw.sourceUrl}`);
  }
  const combined = [
    `企业名称：${raw.companyName}`,
    `行业：${raw.rawIndustry}`,
    `摘要：${raw.summary}`,
    detailText,
  ].join("\n");

  try {
    const { output } = await generateText({
      model: getModel(),
      prompt: buildPrompt(combined, raw, vendorName),
      output: Output.object({ schema: extractedCaseSchema }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: 8_000,
      abortSignal: AbortSignal.timeout(120_000),
    });
    return output as ExtractedCase;
  } catch (err: any) {
    console.error(`[extract] LLM 抽取失败 ${raw.sourceUrl}:`, err.message || err);
    return null;
  }
}
