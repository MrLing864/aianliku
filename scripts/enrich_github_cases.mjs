// 国外案例深度补全脚本（enrich_github_cases）
//
// 流程：读取现有 gh-aicase-* 案例 → 规范化来源 URL → Tavily 提取原始网页
//      → 必要时搜索官方补充来源 → DeepSeek 两阶段结构化抽取（事实 + 独立复核）
//      → 通过发布门槛则备份旧数据并原地更新，否则保留原案例并记录原因。
//
// 设计为可恢复的异步任务：断点续跑、失败重试、并发限制、指数退避、幂等写入、按批次回滚。
//
// 命令（见 package.json）：
//   npm run cases:enrich:prepare   # 仅创建 run 记录 + 初始化 jobs（不抓取）
//   npm run cases:enrich:canary    # 试运行 50 条代表案例
//   npm run cases:enrich:run       # 全量补全 3023 条
//   npm run cases:enrich:retry     # 重试 failed / source_limited / insufficient_evidence
//   npm run cases:enrich:report    # 输出进度与质量报告
//   npm run cases:enrich:rollback  # 回滚最近一次 run（恢复快照）
//
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------- 轻量 .env 加载（不覆盖已有 process.env） ----------
function loadEnv(name) {
  try {
    const raw = readFileSync(join(ROOT, name), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][\w]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}
loadEnv(".env.local");
loadEnv(".env");

// ---------- 配置 ----------
const PROMPT_VERSION = "enrich-v1";
const MODEL = process.env.AI_MODEL || "deepseek-v4-pro";
const TAVILY_MODEL = "best"; // Tavily extract 模式
const CONCURRENCY = Number(process.env.ENRICH_CONCURRENCY || 4);
const CANARY_SIZE = Number(process.env.ENRICH_CANARY_SIZE || 50);
const MATCH_THRESHOLD = 0.9; // 企业与项目匹配门槛
const HUNYUAN_MODEL = process.env.HUNYUAN_MODEL || "hunyuan-2.0-instruct-20251111";
const MAX_SOURCE_CHARS = Number(process.env.MAX_SOURCE_CHARS || 12000); // 来源截断，降本
const AI_PROVIDER = (process.env.AI_PROVIDER || "deepseek").toLowerCase();
const SOURCE_COLLECTION = "sources";
const CASE_COLLECTION = "cases";
const JOB_COLLECTION = "case_enrichment_jobs";
const RUN_COLLECTION = "enrichment_runs";
const SNAPSHOT_COLLECTION = "case_enrichment_snapshots";
const CASE_PREFIX = "gh-aicase-";

// ---------- CloudBase 原生接入（避免直接 import TS 模块） ----------
import cloudbase from "@cloudbase/node-sdk";
function getCbApp() {
  if (!process.env.CLOUDBASE_ENV || !process.env.CLOUDBASE_SECRET_ID || !process.env.CLOUDBASE_SECRET_KEY) {
    throw new Error("CloudBase 未配置：请设置 CLOUDBASE_ENV / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY");
  }
  return cloudbase.init({
    env: process.env.CLOUDBASE_ENV,
    secretId: process.env.CLOUDBASE_SECRET_ID,
    secretKey: process.env.CLOUDBASE_SECRET_KEY,
    region: process.env.CLOUDBASE_REGION || "ap-shanghai",
  });
}

function db() {
  return getCbApp().database();
}
function coll(name) {
  return db().collection(name);
}

// CloudBase 文档库需先建集合；写入前惰性创建（幂等，集合已存在则忽略报错）
const _ensured = new Set();
async function ensureCollection(name) {
  if (_ensured.has(name)) return;
  try {
    await db().createCollection(name);
    log(`✓ 已创建集合 ${name}`);
  } catch (e) {
    const msg = redactErr(e);
    // 已存在或无权建集合时忽略，交由后续写入暴露真实错误
    if (!/already|exist/i.test(msg)) log(`⚠ 创建集合 ${name} 提示：${msg}`);
  }
  _ensured.add(name);
}

// 简易日志（不输出密钥、网页正文、个人联系方式）
function log(...args) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}]`, ...args);
}
function sanitize(s) {
  if (!s) return s;
  return String(s)
    .replace(/sk-[A-Za-z0-9]{6,}/g, "***")
    .replace(/tvly-[A-Za-z0-9-]{6,}/g, "***")
    .replace(/TAVILY_API_KEY=\S+/g, "TAVILY_API_KEY=***")
    .replace(/DEEPSEEK_API_KEY=\S+/g, "DEEPSEEK_API_KEY=***");
}
function redactErr(e) {
  return sanitize(e?.message || String(e));
}

// ---------- URL 规范化（缓存键：相同 URL 只抓一次） ----------
function normalizeUrl(raw) {
  if (!raw) return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  // 去掉常见追踪参数与 fragment
  const dropParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "ref_src", "fbclid", "gclid"];
  const params = new URLSearchParams(u.search);
  for (const p of dropParams) params.delete(p);
  u.search = params.toString();
  u.hash = "";
  u.pathname = u.pathname.replace(/\/+$/, "") || "/";
  // 统一小写 host
  u.hostname = u.hostname.toLowerCase();
  return u.toString();
}

function hashContent(s) {
  // 轻量字符串哈希（FNV-1a），用于内容缓存与幂等
  let h = 0x811c9dc5;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// ---------- 宽松 JSON 解析（兼容推理模型的思考前缀 / markdown 代码块） ----------
function parseJsonLoose(text) {
  if (text == null) throw new Error("模型返回为空");
  let t = String(text).trim();
  // 去除 markdown 代码块围栏
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t) throw new Error("模型返回为空");
  // 直接解析
  try {
    return JSON.parse(t);
  } catch {
    /* 继续尝试截取 */
  }
  // 查找首个 { 或 [
  const objIdx = t.indexOf("{");
  const arrIdx = t.indexOf("[");
  let start = -1;
  if (objIdx === -1) start = arrIdx;
  else if (arrIdx === -1) start = objIdx;
  else start = Math.min(objIdx, arrIdx);
  if (start === -1) throw new Error("未找到 JSON 结构");
  const stack = [];
  let end = -1;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}") {
      if (stack[stack.length - 1] === "{") stack.pop();
    } else if (c === "]") {
      if (stack[stack.length - 1] === "[") stack.pop();
    }
    if (stack.length === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error("JSON 结构不完整");
  return JSON.parse(t.slice(start, end + 1));
}

// ---------- 并发限制 + 指数退避 ----------
async function withRetry(fn, { retries = 4, base = 1000, max = 30000 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > retries) throw e;
      const wait = Math.min(max, base * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
      log(`   ↳ 重试 ${attempt}/${retries}，${wait}ms 后：${redactErr(e)}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const cur = idx++;
      try {
        results[cur] = await worker(items[cur], cur);
      } catch (e) {
        results[cur] = { error: redactErr(e) };
      }
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(runners);
  return results;
}

// ---------- Tavily 抓取（Extract + Search） ----------
function tavilyKey() {
  const k = process.env.TAVILY_API_KEY;
  if (!k) throw new Error("TAVILY_API_KEY 未配置");
  return k;
}

async function tavilyExtract(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return [];
  const body = { api_key: tavilyKey(), urls: unique, format: "markdown", extract_depth: "advanced" };
  const res = await withRetry(async () => {
    const r = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`Tavily Extract HTTP ${r.status}`);
    return r.json();
  });
  return res.results || [];
}

async function tavilySearch(query, max = 5) {
  if (!query) return [];
  const body = { api_key: tavilyKey(), query, max_results: max, search_depth: "advanced", include_raw_content: false };
  const res = await withRetry(async () => {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`Tavily Search HTTP ${r.status}`);
    return r.json();
  });
  return res.results || [];
}

// ---------- Blob 快照存储 ----------
async function saveSnapshot(payload) {
  // 兼容：若配置了 blob 则存正文，否则仅返回 null key（数据库只存元数据）
  try {
    const projectId = process.env.EO_BLOB_PROJECT_ID;
    const token = process.env.EO_BLOB_TOKEN;
    if (!projectId || !token) return null;
    const { getStore } = await import("@edgeone/pages-blob");
    const store = getStore({ name: process.env.EO_BLOB_STORE || "aianliku", projectId, token });
    const key = `enrich-sources/${payload.sourceId}.md`;
    await store.set(key, payload.content || "", { cacheControl: "no-store" });
    return key;
  } catch (e) {
    log(`   ↳ 快照保存失败（仅存元数据）：${redactErr(e)}`);
    return null;
  }
}

// ---------- DeepSeek 两阶段 ----------
async function getDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");
  const [{ createDeepSeek }, { generateText }, { z }] = await Promise.all([
    import("@ai-sdk/deepseek"),
    import("ai"),
    import("zod"),
  ]);
  const model = createDeepSeek({ apiKey })(MODEL);
  return {
    model,
    generateText,
    z,
    providerOptions: { deepseek: { thinking: { type: "enabled" }, reasoningEffort: "medium" } },
  };
}

// ---------- 混元（TokenHub 直连）单阶段 ----------
// 走腾讯云 TokenHub OpenAI 兼容网关（baseURL=tokenhub.tencentmaas.com/v1），模型 hy3。
// 用 fetch 直连，封装成与 Vercel AI SDK generateText 兼容的调用形态，
// 以便 enrichOne 现有代码无需改动。
async function getHunyuan() {
  const apiKey = process.env.TOKENHUB_API_KEY;
  const baseURL = process.env.TOKENHUB_BASE_URL || "https://tokenhub.tencentmaas.com/v1";
  if (!apiKey) throw new Error("TOKENHUB_API_KEY 未配置，无法使用混元(TokenHub)");
  const [{ z }] = await Promise.all([import("zod")]);

  // model 字段在 TokenHub 下仅作占位（实际模型由 HUNYUAN_MODEL 决定）
  const model = { provider: "tokenhub", modelId: HUNYUAN_MODEL };

  // 兼容 Vercel AI SDK 的 generateText 调用形态
  const generateText = async ({ model: _m, system, prompt, maxOutputTokens, abortSignal }) => {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });
    const r = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: HUNYUAN_MODEL,
        messages,
        max_tokens: maxOutputTokens || 8000,
        temperature: 0.2,
      }),
      signal: abortSignal,
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      const err = new Error(`TokenHub HTTP ${r.status}: ${detail.slice(0, 400)}`);
      if (r.status === 429) err.code = "RATE_LIMIT";
      if (r.status === 402 || r.status === 403) err.code = "INSUFFICIENT_BALANCE";
      throw err;
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return { text };
  };

  return { model, generateText, z, providerOptions: undefined };
}

// ---------- 抽取结果字段类型矫正（兼容模型常见偏差） ----------
const coerceStr = (v) =>
  v == null
    ? ""
    : Array.isArray(v)
    ? v.filter((x) => x != null && x !== "").map(String).join("；")
    : String(v);

const coerceStrOpt = (v) => {
  const s = coerceStr(v).trim();
  return s === "" ? undefined : s;
};

const coerceSteps = (v) => {
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== "").map(String);
  if (typeof v === "string") return v.split(/[\n;；]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

const coerceResults = (v) => {
  const arr = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  return arr
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      label: String(x.label || x.name || x.metric || x.indicator || ""),
      value: String(x.value || x.result || x.measure || ""),
      baseline: x.baseline != null ? String(x.baseline) : undefined,
      unit: x.unit != null ? String(x.unit) : undefined,
      improvement: x.improvement != null ? String(x.improvement) : undefined,
    }));
};

const coerceEvidence = (v) => {
  if (Array.isArray(v)) {
    return v
      .filter((x) => x && (x.field || x.name || x.snippet || x.excerpt))
      .map((x) => ({
        field: String(x.field || x.name || ""),
        snippet: String(x.snippet || x.excerpt || x.text || ""),
      }));
  }
  if (v && typeof v === "object") {
    return Object.entries(v).map(([field, snippet]) => ({
      field: String(field),
      snippet: String(snippet || ""),
    }));
  }
  return [];
};

const coerceOutcome = (v) => {
  const s = coerceStr(v).toLowerCase();
  if (s.includes("fail")) return "failure";
  if (s.includes("partial")) return "partial";
  if (s.includes("success")) return "success";
  return "undisclosed";
};

const coerceBool = (v) => v === true || v === "true" || v === "是" || v === 1 || v === "yes" || v === "可";

// 第一阶段：事实抽取（JSON + 宽容 Zod 校验，兼容模型结构偏差）
const EXTRACT_SCHEMA_BUILDER = (z) =>
  z.object({
    problem: z.preprocess(coerceStr, z.string()),
    solution: z.preprocess(coerceStr, z.string()),
    implementationSteps: z.preprocess(coerceSteps, z.array(z.string())),
    results: z.preprocess(
      coerceResults,
      z.array(
        z.object({
          label: z.string(),
          value: z.string(),
          baseline: z.string().optional(),
          unit: z.string().optional(),
          improvement: z.string().optional(),
        }),
      ),
    ),
    risks: z.preprocess(coerceStr, z.string()),
    riskAnalysis: z.preprocess(coerceStr, z.string()),
    organizationSize: z.preprocess(coerceStr, z.string()),
    deploymentScale: z.preprocess(coerceStr, z.string()),
    implementationYear: z.preprocess(coerceStr, z.string()),
    duration: z.preprocess(coerceStr, z.string()),
    cost: z.preprocess(coerceStr, z.string()),
    roi: z.preprocess(coerceStr, z.string()),
    testimonial: z.preprocess(coerceStr, z.string()),
    testimonialAuthor: z.preprocess(coerceStrOpt, z.string().optional()),
    testimonialTitle: z.preprocess(coerceStrOpt, z.string().optional()),
    outcomeStatus: z.preprocess(coerceOutcome, z.enum(["success", "partial", "failure", "undisclosed"])),
    evidence: z.preprocess(coerceEvidence, z.array(z.object({ field: z.string(), snippet: z.string() }))),
  });

const VERIFY_SCHEMA_BUILDER = (z) =>
  z.object({
    matchScore: z.preprocess(
      (v) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""))),
      z.number().min(0).max(1),
    ),
    matchRationale: z.preprocess(coerceStr, z.string()),
    corrections: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v.map((x) => ({ field: String(x?.field || x?.name || ""), issue: String(x?.issue || x?.problem || "") }))
          : [],
      z.array(z.object({ field: z.string(), issue: z.string() })),
    ),
    confidence: z.preprocess((v) => {
      const s = coerceStr(v).toLowerCase();
      if (s.includes("high") || s === "高") return "high";
      if (s.includes("med") || s === "中") return "medium";
      return "pending";
    }, z.enum(["high", "medium", "pending"])),
    finalOutcomeStatus: z.preprocess(coerceOutcome, z.enum(["success", "partial", "failure", "undisclosed"])),
    publishable: z.preprocess(coerceBool, z.boolean()),
  });

// 单阶段：抽取 + 复核合并（降本，token 约减半）。复用抽取字段并追加匹配判断。
const ENHANCED_SCHEMA_BUILDER = (z) =>
  EXTRACT_SCHEMA_BUILDER(z).extend({
    matchScore: z.preprocess(
      (v) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""))),
      z.number().min(0).max(1),
    ),
    matchRationale: z.preprocess(coerceStr, z.string()),
    confidence: z.preprocess((v) => {
      const s = coerceStr(v).toLowerCase();
      if (s.includes("high") || s === "高") return "high";
      if (s.includes("med") || s === "中") return "medium";
      return "pending";
    }, z.enum(["high", "medium", "pending"])),
    publishable: z.preprocess(coerceBool, z.boolean()),
  });

// 合并抽取 + 复核的单阶段提示词
function buildEnrichedPrompt(caseDoc, sourceText) {
  const org = caseDoc.organization?.name || "";
  const title = caseDoc.title || "";
  const scenarios = (caseDoc.scenarios || []).map((s) => s.name).join("、");
  const desc = caseDoc.summary || "";
  return `你是一名严谨的中文企业案例编辑，同时担任独立复核。下面给出一条「企业 AI 应用案例」的现有信息与官方/原始素材。请基于素材一次性完成：(A) 抽取结构化字段；(B) 判断该案例是否真实可发布。

【案例标题】${title}
【被改造企业（非供应商）】${org}
【AI 场景】${scenarios}
【现有业务背景摘要】${desc}

【原始网页/官方素材】
${sourceText}

抽取要求：
1. 严格基于素材，不得臆造。素材不足时填「未披露」。
2. problem：来源明确描述的业务问题；若仅给背景，可从背景拆分痛点。
3. solution：具体做法、流程、落地方式，不要只罗列模型/工具名。
4. implementationSteps：仅当素材能支持顺序时输出，否则空数组。
5. results：拆成独立指标，保留原始单位与改善幅度；无则空数组。
6. risks：仅保存来源明确披露的风险/限制/失败经验。
7. riskAnalysis：平台风险分析（可基于常识补充），与来源风险区分。
8. organizationSize / deploymentScale / implementationYear / duration / cost / roi：必须有来源证据；无则「未披露」。
9. testimonial：必须逐字来自来源，附负责人姓名或职务；无则「未披露」。
10. outcomeStatus：失败须有明确依据；只介绍方案未披露结果则「undisclosed」。
11. evidence：为关键字段给出原文片段（逐字，≤120字），格式 [{field, snippet}]。

复核要求：
12. matchScore：0~1 之间，表示「被改造企业」与「项目/AI 应用」的匹配可信度。若企业名与素材明显不符、或素材只是供应商宣传而非真实落地案例，给低分（<0.9）。
13. matchRationale：一句话说明评分依据。
14. confidence：high/medium/pending。
15. publishable：matchScore≥0.9 且非供应商自吹式宣传且信息基本可核验时为 true，否则 false。

严格按以下 JSON 输出：
{
  "problem": "字符串","solution": "字符串","implementationSteps": ["步骤1"],
  "results": [{"label":"指标名","value":"数值或描述","baseline":"基线(可选)","unit":"单位(可选)","improvement":"提升(可选)"}],
  "risks": "字符串","riskAnalysis": "字符串","organizationSize": "字符串","deploymentScale": "字符串",
  "implementationYear": "字符串","duration": "字符串","cost": "字符串","roi": "字符串",
  "testimonial": "字符串","testimonialAuthor": "字符串(可选)","testimonialTitle": "字符串(可选)",
  "outcomeStatus": "success | partial | failure | undisclosed",
  "evidence": [{"field":"problem","snippet":"原文片段"}],
  "matchScore": 0.95,"matchRationale": "字符串","confidence": "high","publishable": true
}`;
}

function buildExtractPrompt(caseDoc, sourceText) {
  const org = caseDoc.organization?.name || "";
  const title = caseDoc.title || "";
  const scenarios = (caseDoc.scenarios || []).map((s) => s.name).join("、");
  const desc = caseDoc.summary || "";
  return `你是一名严谨的中文企业案例编辑。下面给出一条「企业 AI 应用案例」的现有信息与来自官方/原始网页的素材。请基于素材，抽取并补全该案例的结构化字段。

【案例标题】${title}
【被改造企业（非供应商）】${org}
【AI 场景】${scenarios}
【现有业务背景摘要】${desc}

【原始网页/官方素材】
${sourceText}

要求：
1. 严格基于素材，不得臆造。素材不足时填写「未披露」。
2. problem：来源明确描述的业务问题；若素材只给背景，可从背景拆分出痛点。
3. solution：具体做法、流程、落地方式，不要只罗列模型/工具名。
4. implementationSteps：仅当素材能支持顺序时输出，否则为空数组。
5. results：拆成独立指标，保留原始单位与改善幅度；无则空数组。
6. risks：仅保存来源明确披露的风险/限制/失败经验。
7. riskAnalysis：你的平台分析（可基于常识补充风险提示），与来源风险区分。
8. organizationSize：仅接受员工数或来源明确给出的企业规模；无则「未披露」。
9. deploymentScale：项目覆盖范围（门店数/医院数等），区别于企业总体规模。
10. implementationYear：仅使用明确实施时间，不得拿文章发布日期代替；无则「未披露」。
11. duration / cost / roi：必须有来源证据，保留原始货币与表达；无则「未披露」。roi 仅接受来源明确披露，普通效果指标不得当作 ROI。
12. testimonial：必须逐字来自来源，附负责人姓名或职务；英文不超过 25 词。无则「未披露」。
13. outcomeStatus：失败须有明确依据；只介绍方案未披露结果则「undisclosed」。
14. evidence：为关键字段（problem/solution/results/risks/organizationSize/deploymentScale/implementationYear/duration/cost/roi/testimonial）给出能支持该字段的原文片段（逐字，≤120字），格式为对象数组 [{field, snippet}]。
15. 所有字符串字段若素材无依据，填「未披露」。

严格按以下 JSON 结构输出，字段名与类型不得随意更改；risks 与 riskAnalysis 必须是字符串，evidence 必须是数组：
{
  "problem": "字符串",
  "solution": "字符串",
  "implementationSteps": ["步骤1", "步骤2"],
  "results": [{"label":"指标名","value":"数值或描述","baseline":"基线(可选)","unit":"单位(可选)","improvement":"提升(可选)"}],
  "risks": "字符串：来源明确披露的风险/限制",
  "riskAnalysis": "字符串：平台风险分析",
  "organizationSize": "字符串",
  "deploymentScale": "字符串",
  "implementationYear": "字符串，如 2023",
  "duration": "字符串",
  "cost": "字符串",
  "roi": "字符串",
  "testimonial": "字符串",
  "testimonialAuthor": "字符串(可选)",
  "testimonialTitle": "字符串(可选)",
  "outcomeStatus": "success | partial | failure | undisclosed",
  "evidence": [{"field":"problem","snippet":"原文片段"}]
}`;
}

function buildVerifyPrompt(caseDoc, sourceText, extracted) {
  const org = caseDoc.organization?.name || "";
  const title = caseDoc.title || "";
  return `你是独立的复核编辑。请重新读取原始素材与下方第一阶段抽取结果，判断是否可发布。

【案例标题】${title}
【被改造企业】${org}

【原始素材】
${sourceText}

【第一阶段结果（JSON）】
${JSON.stringify(extracted)}

请检查：
1. 素材是否确实对应该企业与该项目（matchScore 0-1）。
2. 数字、年份、货币、百分比、单位、引述是否与原文一致。
3. 是否把「企业总体规模」误当作「项目部署规模」。
4. 删除无法被来源支持的字段（在 corrections 列出）。
5. 重新判断 finalOutcomeStatus 与整体 confidence。
6. publishable 默认 true；仅当检测到企业/项目串案（matchScore<0.9），或 problem/solution 完全缺乏来源证据时，才设为 false。注意：来源未披露的字段（规模/年份/成本/ROI 等）统一标「未披露」即可，不应因此判定不可发布。

输出 JSON（字段：matchScore, matchRationale, corrections[], confidence, finalOutcomeStatus, publishable）。`;
}

// ---------- 主流程：单案例补全 ----------
async function enrichOne(caseDoc, runId, deps) {
  const { model, z } = deps;
  const srcUrl = normalizeUrl(caseDoc.sources?.[0]?.url || caseDoc.sourceUrl);
  if (!srcUrl) {
    return { status: "insufficient_evidence", rejectReason: "no_source_url" };
  }

  // 1) 抓取来源（带缓存：相同归一化 URL 只抓一次）
  let sourceText = "";
  let publisher = caseDoc.sources?.[0]?.publisher || "";
  let publishedAt = caseDoc.sources?.[0]?.publishedAt || "";
  const extracted = await tavilyExtract([srcUrl]);
  if (extracted.length) {
    sourceText = extracted[0].raw_content || extracted[0].content || "";
    publisher = publisher || extracted[0].title || "";
  }
  // 来源截断，降低 token 消耗
  if (sourceText.length > MAX_SOURCE_CHARS) {
    sourceText = sourceText.slice(0, MAX_SOURCE_CHARS) + "\n…[已截断]";
  }

  // 2) 不足则搜索官方补充（必须与企业和项目同时匹配）
  if (sourceText.length < 300) {
    const q = `${caseDoc.organization?.name || ""} ${caseDoc.title || ""} AI case study`.trim();
    const hits = await tavilySearch(q, 3);
    for (const h of hits) {
      if (h.content && h.content.length > sourceText.length) {
        sourceText = h.content;
        publisher = publisher || h.title || "";
      }
    }
  }

  if (sourceText.length < 200) {
    return { status: "source_limited", rejectReason: "source_too_short", sourceText };
  }

  // 3) 单阶段：事实抽取 + 独立复核合并（降本，原两阶段调用合并为一次）
  const enhancedSchema = ENHANCED_SCHEMA_BUILDER(z);
  const enriched = await withRetry(async () => {
    const r = await deps.generateText({
      model,
      system:
        "你是严谨的中文企业案例编辑，同时担任独立复核。严格基于素材一次性输出抽取字段与发布判断的 JSON，禁止臆造。只输出 JSON 本身，不要任何解释、不要 markdown 代码块、不要前后缀文字。",
      prompt: buildEnrichedPrompt(caseDoc, sourceText) + "\n\n仅输出符合 schema 的 JSON。",
      providerOptions: deps.providerOptions,
      maxOutputTokens: 10000,
      abortSignal: AbortSignal.timeout(180000),
    });
    const parsed = parseJsonLoose(r.text);
    return enhancedSchema.parse(parsed);
  }, { retries: 3 });

  // 兼容下游字段命名（原 extractRes / verifyRes）
  const extractRes = enriched;
  const verifyRes = enriched;

  if ((verifyRes.matchScore ?? 0) < MATCH_THRESHOLD) {
    return {
      status: "insufficient_evidence",
      rejectReason: `match_score=${(verifyRes.matchScore ?? 0).toFixed(2)}<${MATCH_THRESHOLD} or not publishable`,
      extract: extractRes,
      verify: verifyRes,
      sourceText,
    };
  }

  // 5) 构建更新字段 + 字段证据
  const sourceId = `src-${hashContent(srcUrl)}`;
  const accessedAt = new Date().toISOString();
  const evidenceMap = {};
  for (const e of extractRes.evidence || []) {
    const field = e.field;
    if (!evidenceMap[field]) evidenceMap[field] = [];
    evidenceMap[field].push({
      sourceId,
      url: srcUrl,
      publisher,
      publishedAt,
      excerpt: e.snippet,
      accessedAt,
    });
  }

  const fieldEvidence = {
    problem: evidenceMap.problem || [],
    solution: evidenceMap.solution || [],
    results: evidenceMap.results || [],
    risks: evidenceMap.risks || [],
    organizationSize: evidenceMap.organizationSize || [],
    deploymentScale: evidenceMap.deploymentScale || [],
    implementationYear: evidenceMap.implementationYear || [],
    duration: evidenceMap.duration || [],
    cost: evidenceMap.cost || [],
    roi: evidenceMap.roi || [],
    testimonial: evidenceMap.testimonial || [],
  };

  const roiBasis = extractRes.roi && extractRes.roi !== "未披露" ? "source_disclosed" : "undisclosed";
  const implementationYear = /^\d{4}$/.test(extractRes.implementationYear) ? Number(extractRes.implementationYear) : undefined;

  const updates = {
    problem: extractRes.problem,
    solution: extractRes.solution,
    implementationSteps: extractRes.implementationSteps || [],
    results: (extractRes.results || []).map((m) => ({
      label: m.label,
      value: m.value,
      baseline: m.baseline,
      unit: m.unit,
      improvement: m.improvement,
      sourceId,
      kind: "actual",
    })),
    risks: extractRes.risks,
    riskAnalysis: extractRes.riskAnalysis ? { analysis: extractRes.riskAnalysis } : null,
    deploymentScale: extractRes.deploymentScale,
    implementationYear,
    duration: extractRes.duration,
    cost: extractRes.cost,
    roi: extractRes.roi,
    roiBasis,
    outcomeStatus: verifyRes.finalOutcomeStatus,
    confidence: verifyRes.confidence,
    testimonial:
      extractRes.testimonial && extractRes.testimonial !== "未披露"
        ? { quote: extractRes.testimonial, author: extractRes.testimonialAuthor, authorTitle: extractRes.testimonialTitle, sourceId }
        : null,
    fieldEvidence,
    sources: [
      {
        id: sourceId,
        title: publisher || caseDoc.title,
        publisher,
        type: "company",
        url: srcUrl,
        publishedAt,
        collectedAt: accessedAt,
        accessibility: "available",
        excerpt: (evidenceMap.problem?.[0]?.excerpt || evidenceMap.solution?.[0]?.excerpt || "") ,
        supports: ["problem", "solution", "results", "risks", "implementationYear", "duration", "cost", "roi", "testimonial"],
      },
    ],
    enrichment: {
      status: "published",
      runId,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      sourceContentHash: hashContent(sourceText),
      enrichedAt: accessedAt,
      confidence: verifyRes.confidence,
      matchScore: verifyRes.matchScore,
    },
    updatedAt: accessedAt,
  };

  return { status: "published", updates, sourceId, sourceText, publisher, publishedAt, accessedAt, srcUrl };
}

// ---------- 运行管理 ----------
function newRunId(mode) {
  return `enr-${mode}-${Date.now().toString(36)}`;
}

async function ensureRunCollections() {
  await ensureCollection(RUN_COLLECTION);
  await ensureCollection(JOB_COLLECTION);
  await ensureCollection(SNAPSHOT_COLLECTION);
}

async function ensureRun(run) {
  await coll(RUN_COLLECTION).add(run);
}
async function updateRun(runId, patch) {
  await coll(RUN_COLLECTION).where({ runId }).update(patch);
}

// CloudBase .get() 单次上限 100，需分页拉全量
async function fetchAllCases(where, limit = 1000) {
  const out = [];
  let skip = 0;
  for (;;) {
    const page = (await coll(CASE_COLLECTION).where(where).limit(limit).skip(skip).field({ id: 1, slug: 1, sources: 1, sourceUrl: 1, title: 1, organization: 1, scenarios: 1, summary: 1 }).get()).data || [];
    if (!page.length) break;
    out.push(...page);
    if (page.length < limit) break;
    skip += limit;
  }
  return out;
}

async function fetchCasesToProcess(mode, runId) {
  const where = { id: db().RegExp({ regexp: `^${CASE_PREFIX}`, options: "i" }) };
  const all = await fetchAllCases(where);
  let list = all;
  if (mode === "canary") {
    list = all.slice(0, CANARY_SIZE);
  } else if (mode === "retry") {
    const done = await fetchAllJobs({ status: "published", runId });
    const doneIds = new Set(done.map((d) => d.caseId));
    list = all.filter((c) => !doneIds.has(c.id));
  }
  return list;
}

async function fetchAllJobs(where, limit = 1000) {
  const out = [];
  let skip = 0;
  for (;;) {
    const page = (await coll(JOB_COLLECTION).where(where).limit(limit).skip(skip).get()).data || [];
    if (!page.length) break;
    out.push(...page);
    if (page.length < limit) break;
    skip += limit;
  }
  return out;
}

async function getOrCreateJob(caseId, slug, runId, srcUrl) {
  const existing = (await coll(JOB_COLLECTION).where({ caseId, runId }).limit(1).get()).data || [];
  if (existing.length) return existing[0];
  const doc = {
    caseId,
    slug,
    sourceUrl: srcUrl,
    normalizedUrl: normalizeUrl(srcUrl) || undefined,
    runId,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const res = await coll(JOB_COLLECTION).add(doc);
  return { ...doc, _id: res.id };
}

async function saveSnapshotBeforeUpdate(caseId, runId, beforeDoc) {
  const doc = {
    caseId,
    runId,
    before: beforeDoc,
    createdAt: new Date().toISOString(),
  };
  try {
    await coll(SNAPSHOT_COLLECTION).add(doc);
  } catch (e) {
    log(`   ↳ 快照保存失败：${redactErr(e)}`);
  }
}

async function setJobStatus(jobId, status, patch = {}) {
  await coll(JOB_COLLECTION)
    .where({ _id: jobId })
    .update({ status, updatedAt: new Date().toISOString(), ...patch });
}

// ---------- 子命令 ----------
async function cmdPrepare(mode) {
  await ensureRunCollections();
  const runId = newRunId(mode);
  const cases = await fetchCasesToProcess(mode, runId);
  const run = {
    runId,
    mode,
    status: "running",
    promptVersion: PROMPT_VERSION,
    model: MODEL,
    total: cases.length,
    published: 0,
    sourceLimited: 0,
    insufficient: 0,
    failed: 0,
    rolledBack: 0,
    startedAt: new Date().toISOString(),
  };
  await ensureRun(run);
  for (const c of cases) {
    const srcUrl = c.sources?.[0]?.url || c.sourceUrl;
    await getOrCreateJob(c.id, c.slug, runId, srcUrl);
  }
  log(`✓ prepared run ${runId}: ${cases.length} jobs (mode=${mode})`);
  return runId;
}

async function cmdRun(mode) {
  const runId = await cmdPrepare(mode);
  const deps = AI_PROVIDER === "hunyuan" ? await getHunyuan() : await getDeepSeek();
  const cases = await fetchCasesToProcess(mode, runId);
  let counts = { published: 0, sourceLimited: 0, insufficient: 0, failed: 0 };

  await mapLimit(cases, CONCURRENCY, async (c) => {
    const job = await getOrCreateJob(c.id, c.slug, runId, c.sources?.[0]?.url || c.sourceUrl);
    if (job.status === "published") {
      log(`• 跳过已发布 ${c.id}`);
      return;
    }
    await setJobStatus(job._id, "fetching", { attempts: (job.attempts || 0) + 1 });
    try {
      const res = await enrichOne(c, runId, deps);
      if (res.status === "published") {
        await saveSnapshotBeforeUpdate(c.id, runId, c);
        // CloudBase `.update(obj)` 对嵌套对象按点路径合并，若字段原为标量 null 会报错。
        // 用 command.set 整体替换每个字段，避免「Cannot create field ... in element {field: null}」。
        const cmd = db().command;
        const safeUpdates = {};
        for (const [k, v] of Object.entries(res.updates)) {
          if (v === undefined) continue; // 跳过 undefined，保持与直接 update 一致（字段省略）
          safeUpdates[k] = cmd.set(v);
        }
        await coll(CASE_COLLECTION).where({ id: c.id }).update(safeUpdates);
        await setJobStatus(job._id, "published", { sourceContentHash: res.updates.enrichment.sourceContentHash });
        // 保存来源快照（若配置了 blob）
        if (res.sourceText) {
          await saveSnapshot({ sourceId: res.sourceId, content: res.sourceText });
        }
        counts.published++;
        log(`✓ 发布 ${c.id} (match=${(res.updates.enrichment.matchScore ?? 0).toFixed(2)})`);
      } else {
        const map = { source_limited: "sourceLimited", insufficient_evidence: "insufficient", failed: "failed" };
        counts[map[res.status] || "failed"]++;
        await setJobStatus(job._id, res.status, { lastError: res.rejectReason || "unknown" });
        log(`• ${res.status} ${c.id}: ${res.rejectReason || ""}`);
      }
    } catch (e) {
      counts.failed++;
      await setJobStatus(job._id, "failed", { lastError: redactErr(e) });
      log(`✗ failed ${c.id}: ${redactErr(e)}`);
    }
  });

  await updateRun(runId, {
    status: "completed",
    finishedAt: new Date().toISOString(),
    published: counts.published,
    sourceLimited: counts.sourceLimited,
    insufficient: counts.insufficient,
    failed: counts.failed,
  });
  log(`\n=== run ${runId} 完成 ===`);
  log(`发布 ${counts.published} / 来源不足 ${counts.sourceLimited} / 证据不足 ${counts.insufficient} / 失败 ${counts.failed}`);
  // canary 质量门槛
  if (mode === "canary") {
    const valid = counts.published + counts.insufficient; // 成功补全（含待复核），计划口径「有效」
    const ok = valid >= 45 && counts.failed === 0 && counts.sourceLimited === 0;
    log(
      ok
        ? `✓ canary 通过质量门槛（有效 ${valid} 条，失败 ${counts.failed}，来源不足 ${counts.sourceLimited}），可启动 npm run cases:enrich:run`
        : "✗ canary 未通过门槛，请检查后重试",
    );
  }
  return runId;
}

async function cmdRetry() {
  return cmdRun("retry");
}

async function cmdReport() {
  const runs = (await coll(RUN_COLLECTION).orderBy("startedAt", "desc").limit(10).get()).data || [];
  log("=== 最近运行 ===");
  for (const r of runs) {
    log(`run=${r.runId} mode=${r.mode} status=${r.status} total=${r.total} published=${r.published} sourceLimited=${r.sourceLimited} insufficient=${r.insufficient} failed=${r.failed} finished=${r.finishedAt || "-"}`);
  }
  const jobs = await fetchAllJobs({});
  const byStatus = {};
  for (const j of jobs) byStatus[j.status] = (byStatus[j.status] || 0) + 1;
  log("=== job 状态分布 ===", JSON.stringify(byStatus));
  // 字段披露率
  const enrichedData = await fetchAllCases({
    id: db().RegExp({ regexp: `^${CASE_PREFIX}`, options: "i" }),
    "enrichment.status": "published",
  });
  const total = enrichedData.length || 1;
  const disclosed = (f) => enrichedData.filter((c) => c[f] && c[f] !== "未披露" && c[f] !== null).length;
  log("=== 披露率（已补全案例）===");
  for (const f of ["problem", "solution", "implementationYear", "duration", "cost", "roi", "testimonial", "deploymentScale", "riskAnalysis"]) {
    log(`  ${f}: ${disclosed(f)}/${enrichedData.length} (${((disclosed(f) / total) * 100).toFixed(1)}%)`);
  }
}

async function cmdRollback() {
  const runs = (await coll(RUN_COLLECTION).orderBy("startedAt", "desc").limit(1).get()).data || [];
  if (!runs.length) {
    log("无可用 run");
    return;
  }
  const run = runs[0];
  if (run.rollback) {
    log("该 run 已回滚");
    return;
  }
  const snaps = (await coll(SNAPSHOT_COLLECTION).where({ runId: run.runId }).get()).data || [];
  let restored = 0;
  for (const s of snaps) {
    if (s.before) {
      const { _id, ...before } = s.before;
      await coll(CASE_COLLECTION).where({ id: s.caseId }).update(before);
      restored++;
    }
  }
  await updateRun(run.runId, { rollback: { at: new Date().toISOString(), reason: "manual", restored } });
  await coll(JOB_COLLECTION).where({ runId: run.runId }).update({ status: "rolled_back" });
  log(`✓ 已回滚 run=${run.runId}，恢复 ${restored} 条案例`);
}

// ---------- 临时导出（供 _smoke_e2e 验证，验证后删除） ----------
export { getHunyuan, ENHANCED_SCHEMA_BUILDER, buildEnrichedPrompt, parseJsonLoose };

// ---------- 入口 ----------
const sub = process.argv[2] || "run";
async function main() {
  if (!process.env.CLOUDBASE_ENV) {
    log("⚠ 未检测到 CloudBase 配置，将尝试从 .env 加载");
  }
  switch (sub) {
    case "prepare":
      await cmdPrepare(process.argv[3] === "canary" ? "canary" : "full");
      break;
    case "canary":
      await cmdRun("canary");
      break;
    case "run":
      await cmdRun("full");
      break;
    case "retry":
      await cmdRetry();
      break;
    case "report":
      await cmdReport();
      break;
    case "rollback":
      await cmdRollback();
      break;
    default:
      log("用法: node scripts/enrich_github_cases.mjs [prepare|canary|run|retry|report|rollback]");
  }
}

main().catch((e) => {
  console.error("FATAL", redactErr(e));
  process.exit(1);
});
