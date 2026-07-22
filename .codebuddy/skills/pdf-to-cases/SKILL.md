# PDF → CaseStudy 入库 Skill

将行业报告/白皮书 PDF 解析为结构化案例，并插入 CloudBase 的 `cases` 集合。

---

## 流程总览（4步，已修正 ✅）

```
PDF 文件 → [1.OCR提取] → [2.阅读抽取] → [3.生成完整CaseStudy JSON] → [4.直接入库]
```

> ⚠️ **关键修正（v2）**：不要再走“先生成 `categories` 中间结构、再写 `fix-xxx-schema.mjs` 修复”的老路。
> 老路会把 `industry` 存成 slug 字符串、`sources[].type` 写成非法的 `"report"`，导致列表页
> `Cannot read properties of undefined (reading 'displayName')` 直接 500（详见“常见错误回顾”）。
> **第3步直接用 Python 生成含完整 `industry` / `scenarios` 对象的 `CaseStudy`，第4步入库即正确，无需修复步骤。**

---

## 第1步：复制 PDF 并 OCR 提取文本

```powershell
# 复制 PDF 到项目 report/ 目录
copy "源PDF路径" "c:\Users\Administrator\Desktop\aianliku\code\report\文件名.pdf"

# OCR 提取（会自动生成 report_ocr/文件名.txt）
cd c:\Users\Administrator\Desktop\aianliku\code
python3 scripts/ocr_reports.py "文件名关键词"   # 单个文件
python3 scripts/ocr_reports.py --pending        # 批量：跳过已有 .done 的文件
```

OCR 脚本位于 `scripts/ocr_reports.py`，基于 `RapidOCR (rapidocr_onnxruntime)` + `PyMuPDF (fitz)`。
- 输入：`report/*.pdf`
- 输出：`report_ocr/文件名.txt`（每页以 `===== PAGE N =====` 分隔）
- 断点续传：完成后生成 `.done` 标记文件

---

## 第2步：阅读 OCR 文本，抽取案例

逐页阅读 `report_ocr/文件名.txt`，识别所有案例段落。每个案例需提炼以下原始信息：

```json
{
  "enterprise": "企业全称",
  "title": "企业名称+核心场景+AI落地方向（案例标题）",
  "summary": "200-500字案例摘要，客观复述PDF中的事实",
  "industry": "临时行业slug（后续会映射到catalog）",
  "scenario": ["临时场景slug数组"],
  "metrics": ["量化指标列表"],
  "source": "PDF报告的完整引用"
}
```

**案例识别标准**：
- 有明确的企业/品牌名称
- 有 AI 落地的具体动作或工具
- 有可量化的成效数据

---

## 第3步：用 Python 生成 JSON（关键！）

**⚠️ 必须用 Python `json.dump()` 生成 JSON，严禁手写字符串拼接。**

原因：中文内容中可能包含弯引号 `""`、直引号 `"`、破折号等特殊字符，手写 JSON 极易导致解析崩溃。

模板脚本（保存为 `scripts/gen_xxx_cases.py`，参考已跑通的 `gen_beijing_cases.py` / `gen_dataanalysis_cases.py`）：

```python
# -*- coding: utf-8 -*-
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

# ⚠️ 1) 必须从 src/lib/catalog.ts 复制合法 Industry / Scenario 完整对象（不是 slug 字符串！）
IND = {
    "manufacturing": {"id": "industry-manufacturing", "code": "C", "name": "制造业",
                      "displayName": "制造业", "slug": "manufacturing",
                      "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。",
                      "icon": "Factory", "featured": True, "standardVersion": "GB/T 4754-2017+1"},
    # ... 其它用到的行业（retail/finance/healthcare/software-internet/telecom/government/energy-mining/automotive/education/construction/other ...）
}
SCN = {
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服"],
                         "icon": "MessagesSquare", "featured": True},
    # ... 其它用到的场景（knowledge-base/sales/forecast/agent/workflow/quality-inspection/content-generation/rnd-design/ai-infra/ocr ...）
}

REPORT_TITLE = "报告完整标题"
REPORT_PUBLISHER = "报告发布方"

def scn(*slugs):
    return [SCN[s] for s in slugs]

def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags, model_stack,
       org_region="未披露", org_size="未披露", client=""):
    slug = f"case-xxx-{idx:02d}"
    client_note = f"（落地客户：{client}）" if client else ""
    return {
        "id": slug, "slug": slug, "version": 1, "title": title,
        "organization": {"id": f"org-{slug}", "name": org_name, "size": org_size, "region": org_region, "type": org_type},
        "industry": IND[industry_slug],                 # ⚠️ 完整对象
        "scenarios": scn(*scenario_slugs),              # ⚠️ 完整对象数组
        "businessFunctions": business_functions,
        "summary": summary, "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": "未披露", "cost": "未披露",
        "results": results,                            # [{label, value, improvement?, kind:"actual"|"estimated"|"expected"}]
        "roi": roi, "risks": risks,
        "editorComment": {"suitableFor": suitable_for, "prerequisites": prerequisites,
                          "priority": priority, "text": f"...{implementer}落地{client_note}..."},
        "implementers": [{"name": implementer, "role": "技术提供方"}],
        "outcomeStatus": "success",                    # ⚠️ 必填枚举
        "contentStatus": "published",
        "confidence": "high",                          # ⚠️ 必填枚举
        "sources": [{"id": f"src-{slug}-0", "title": REPORT_TITLE, "publisher": REPORT_PUBLISHER,
                     "type": "institution",            # ⚠️ 合法 SourceType（institution/government/media/company），绝不写 "report"
                     "publishedAt": "YYYY-MM", "collectedAt": TODAY, "accessibility": "available",
                     "supports": ["最佳实践案例"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款 AI 落地方案咨询",
    }

cases = [
    mk(1, "企业名", "private", "manufacturing", ["agent", "workflow"], ["经营管理"],
       "案例标题", "摘要...", "背景...", "痛点...", "方案...", ["步骤1", "步骤2"],
       [{"label": "指标名", "value": "指标值", "improvement": "+20%", "kind": "actual"}],
       "ROI描述", "风险提示", "适合对象", "前置条件", "建议优先",
       "实施方", "一句话亮点", ["标签1", "标签2"], ["模型栈"]),
    # ... 更多案例
]

out = "scripts/extracted/xxx-cases.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)

# 校验：确保 industry/scenarios 是完整对象且必填字段齐全
data = json.load(open(out, encoding="utf-8"))
bad = 0
for c in data:
    if not isinstance(c["industry"], dict) or "slug" not in c["industry"]:
        bad += 1; print("BAD industry", c["slug"])
    for s in c["scenarios"]:
        if not isinstance(s, dict) or "slug" not in s:
            bad += 1; print("BAD scenario", c["slug"])
    for req in ["outcomeStatus", "confidence", "editorComment", "sources"]:
        if req not in c:
            bad += 1; print("MISSING", req, c["slug"])
print(f"OK: {len(data)} cases, issues={bad}")
```

> 行业/场景的 `id`/`code`/`name`/`displayName`/`slug`/`icon`/`featured`/`standardVersion` 等字段
> **必须与 `src/lib/catalog.ts` 完全一致**（直接复制对应对象即可）。新增未列出的行业/场景会令行业页/场景页找不到案例。

**验证命令**：
```powershell
python scripts/gen_xxx_cases.py
# 预期输出: OK: N cases, issues=0
```

### JSON 编码避坑清单

| ❌ 错误做法 | ✅ 正确做法 |
|------------|------------|
| 手写 `.json` 文件，内容含 `"` 字符 | 用 Python `json.dump()` 自动转义 |
| JSON 字符串含中文弯引号 `""` | 用 `「」` 替代，或用 Python 自动处理 |
| 在 JSON value 中直接嵌入裸 `"` | 让 `json.dump` 自动转义为 `\"` |

---

## 第4步：用通用脚本直接入库（去重 + 文件日志）

已存在通用脚本 `scripts/insert-cases.mjs`，**接受 JSON 路径参数**，按 `title` 去重，直接 `coll.add` 完整 CaseStudy：

```powershell
python scripts/gen_xxx_cases.py
node scripts/insert-cases.mjs scripts/extracted/xxx-cases.json
```

> ⚠️ **PowerShell 下 `node` 的 stdout 经常被 CLIXML 进度流吞掉**，看似“无输出”其实已执行。
> `insert-cases.mjs` 已改为用 `appendFileSync` 把每一步写入 `scripts/insert-run.log`，
> **以该日志为准判断成败**（搜索 `INSERT` / `SKIP` / `Done inserted=N`）。
> 也可用下面命令直接查数据库计数确认：
> ```powershell
> node -e "const fs=require('fs');const l=require('@cloudbase/node-sdk');const t=fs.readFileSync('.env','utf8');for(const x of t.split('\n')){const m=x.match(/^([A-Za-z_][\w]*)=(.*)$/);if(m)process.env[m[1]]=m[2].trim()}const a=l.init({env:process.env.CLOUDBASE_ENV,secretId:process.env.CLOUDBASE_SECRET_ID,secretKey:process.env.CLOUDBASE_SECRET_KEY,region:process.env.CLOUDBASE_REGION||'ap-shanghai'});a.database().collection('cases').where({slug:/^case-xxx-/}).count().then(r=>console.log('COUNT',r.total)).catch(e=>console.log('ERR',e.message))"
> ```

入库成功后：

```powershell
# 启动 dev server（若未运行）
npx next dev --port 3099
# 验证案例页可访问（中文需 URL 编码）
curl -s -o NUL -w "%{http_code}" "http://localhost:3099/cases?q=%E6%A1%88%E4%BE%8B%E4%BC%81%E4%B8%9A%E5%90%8D"
# 预期: 200
```

---

## 第5步：Schema 修复（**已废弃 ⛔，勿再用**）

> ⚠️ **废弃原因**：本步骤原本是为了修补“第4步只存 `categories` 中间结构”的缺陷。但中间结构会留下
> `industry` 为 slug、`sources[].type` 非法的脏数据，是 page 25 列表页 500 崩溃（`Cannot read properties of
> undefined (reading 'displayName')`）的根源。**现在第3步已直接生成完整 `CaseStudy`，入库即正确，本步不再需要。**
> 仅保留下面的 `CaseStudy` 字段清单作为**第3步生成时的字段校验参考**。

### CaseStudy 类型核心字段

```typescript
// src/lib/types.ts 中 CaseStudy 的必填/关键字段：
{
  id: string;                    // 同 slug
  slug: string;                  // URL slug
  title: string;                 // 案例标题
  summary: string;               // 摘要
  organization: {                // 企业信息
    id: string;
    name: string;
    size: string;                // 见 sizeBands
    region?: string;
    anonymous?: boolean;
    type?: "soe"|"private"|"foreign"|"sme";
  };
  industry: Industry;            // ⚠️ 完整对象，不是 slug 字符串！
  scenarios: Scenario[];         // ⚠️ 完整对象数组，不是 slug 字符串数组！
  businessFunctions: string[];   // 从 catalog.businessFunctions 中选
  background: string;            // 企业背景
  problem: string;               // 核心痛点
  solution: string;              // 落地方案
  implementationSteps: string[]; // 实施步骤
  duration: string;              // 实施周期
  cost: string;                  // 投入成本
  results: CaseMetric[];         // 成效指标
  roi: string;                   // ROI 描述
  risks: string;                 // 风险提示
  editorComment: {               // 编辑点评
    suitableFor: string;
    prerequisites: string;
    priority: "建议优先"|"条件具备后开展"|"暂不建议";
    text: string;
  };
  implementers: Implementer[];   // 实施方
  outcomeStatus: OutcomeStatus;  // "success"|"partial"|"failure"|"undisclosed"
  contentStatus: ContentStatus;  // 通常为 "published"
  confidence: ConfidenceLevel;   // "high"|"medium"|"pending"
  sources: CaseSource[];         // 来源
  featured: boolean;
  views: number;
  publishedAt: string;
  updatedAt: string;
  implementationYear?: number;
  painPointTags?: string[];
  techPath?: string[];
  modelStack?: string[];
  sourceReport?: { title; publisher; year };
  // 移除 categories 字段（与 industry/scenarios 冲突）
}
```

### 行业映射规则

**只能使用 `src/lib/catalog.ts` 中已存在的 Industry**：

| slug | displayName | 适用场景 |
|------|-------------|----------|
| `manufacturing` | 制造业 | 工厂、生产制造 |
| `retail` | 零售与消费 | 电商、门店、消费品（**电商白皮书案例默认选此**） |
| `foreign-trade` | 外贸与批发 | 跨境、批发 |
| `logistics` | 物流与仓储 | 仓储配送 |
| `finance` | 金融 | 银行保险 |
| `healthcare` | 医疗健康 | 医院、药企 |
| `education` | 教育 | 学校、培训 |
| `software-internet` | 软件与互联网 | SaaS、互联网平台 |
| `energy-mining` | 能源与矿山 | 煤矿、电力 |
| `automotive` | 汽车 | 整车、零部件 |
| `telecom` | 通信 | 运营商 |
| `government` | 政务与公共服务 | 政府 |
| `aerospace` | 航空航天 | 航空 |
| `construction` | 建筑建材 | 工地、建材 |
| `agriculture` | 农业 | 种植、养殖、牧业（如认养一头牛） |

### 场景映射规则

**只能使用 `src/lib/catalog.ts` 中已存在的 Scenario**：

| slug | name | 对应概念 |
|------|------|----------|
| `ocr` | OCR/文档识别 | 录单、票据识别 |
| `customer-service` | 智能客服 | AI客服、客服机器人 |
| `knowledge-base` | 企业知识库 | RAG、知识问答 |
| `sales` | 销售辅助 | 智能营销、销售助手、投放优化 |
| `quotation` | 智能报价 | 自动报价 |
| `workflow` | 流程自动化 | RPA、自动化 |
| `quality-inspection` | 智能质检 | AI质检 |
| `forecast` | 预测与分析 | 智能报告、数据分析、需求预测 |
| `content-generation` | 内容生成 | AIGC、智能设计、文案生成 |
| `agent` | Agent | AI智能体 |
| `production-scheduling` | 智能排产与工艺优化 | 智能生产、排产 |
| `ops-inspection` | 智能运维与巡检 | 智能运维、巡检 |
| `rnd-design` | 研发设计与仿真 | 研发辅助 |
| `ai-infra` | 算力基础设施与AI平台 | AI平台 |

### Schema 修复脚本模板

保存为 `scripts/fix-xxx-schema.mjs`，核心逻辑：

1. 查询入库的案例：`coll.where({ slug: /^case-xxx-/ }).get()`
2. 对每条记录：
   - 将 `categories.industries[0]` 映射为 `catalog` 中的 Industry 完整对象
   - 将 `categories.scenarios[]` 逐一映射为 Scenario 完整对象数组
   - 根据场景推导 `businessFunctions`（如 销售→"销售"、AI客服→"客服"、AI设计→"研发"）
   - 从 summary 和 metrics 拆分出 `background`、`problem`、`solution`、`results`、`roi`
   - 填充 `implementationSteps`、`duration`、`cost`、`risks`、`editorComment`、`implementers`、`techPath`、`modelStack`、`sourceReport` 等
   - **删除 `categories` 字段**（用 `db.command.remove()`）
   - 修复 `sources[].type`：`"report"` → `"institution"`（或正确的 SourceType）
3. 运行：`node scripts/fix-xxx-schema.mjs`
4. 本地验证：`curl http://localhost:3099/cases?q=关键词`

---

## 本地验证清单

入库和 Schema 修复完成后，必须验证：

```powershell
# 启动 dev server
npx next dev --port 3099

# 新终端中测试
curl -s -o NUL -w "%{http_code}" http://localhost:3099/cases?q=案例企业名
# 预期: 200

curl -s -o NUL -w "%{http_code}" http://localhost:3099/cases/case-xxx-1
# 预期: 200

curl -s -o NUL -w "%{http_code}" http://localhost:3099/
# 预期: 200
```

---

## 历史数据兼容性检查

**每次入库新案例后，必须扫描历史上所有案例**，确保旧数据与新数据的 schema 一致。旧案例可能缺少以下字段：

| 缺失字段 | 默认值 | 说明 |
|----------|--------|------|
| `industry` | 根据标题映射 | 最常缺失！令 `CaseCard` 崩溃 |
| `scenarios` | 根据内容映射 | 缺少时列表页 Badge 为空 |
| `outcomeStatus` | `"undisclosed"` | 令 `OutcomeBadge` 崩溃 |
| `confidence` | `"pending"` | 令 `ConfidenceBadge` 崩溃 |
| `businessFunctions` | `[]` | 搜索过滤时可能不匹配 |

**快速扫描命令**：
```powershell
node -e "
const { readFileSync } = require('fs');
const cloudbase = require('@cloudbase/node-sdk');
// ... 加载 .env, 连接 db
// 遍历所有 published cases, 检查 industry/scenarios/outcomeStatus/confidence
// 打印缺失列表
"
```

发现缺失后用 `coll.where({ slug }).update(fix)` 批量修复。

---

## 前端组件防御性渲染

即使数据库已修复，**前端组件也必须做空值保护**（防御性编程）。涉及的关键文件：

| 文件 | 风险点 | 修复方式 |
|------|--------|----------|
| `src/components/case-card.tsx` | `item.industry.displayName` | `item.industry?.displayName ?? "其他行业"` |
| `src/components/case-card.tsx` | `item.scenarios[0]?.name` | `item.scenarios?.[0]?.name ?? "AI应用"` |
| `src/components/status-badges.tsx` | `outcomeMap[status].className` | `outcomeMap[status] ?? outcomeMap.undisclosed` |
| `src/components/case-editor.tsx` | `item?.industry.slug` | `item?.industry?.slug`（双问号！） |
| `src/app/(site)/cases/[slug]/page.tsx` | `item.industry.displayName` | `item.industry?.displayName ?? "其他行业"` |

---

## 常见错误回顾

| 错误 | 现象 | 根因 | 修复 |
|------|------|------|------|
| JSON 解析失败 | `SyntaxError: Expected ','` | JSON 文件中含中文弯引号 `""` 或裸 `"` | 用 Python `json.dump()` 生成（自动转义） |
| 搜索/列表报 500 | `Cannot read properties of undefined (reading 'displayName')` | 案例的 `industry` 为 `undefined`，`CaseCard` 直接访问 `.displayName` | ① 执行第5步 Schema 修复，补齐 `industry` 对象 ② 组件加 `?.` 可选链 |
| slug 不存在于 catalog | 行业/场景页找不到案例 | 自定义了 catalog 中没有的 slug | 映射到 catalog 中存在的 slug |
| source.type 类型错误 | 类型检查报错 | 用了 `"report"` 而非 `"institution"` | 改为 `SourceType` 中存在的值 |
| OutcomeBadge / ConfidenceBadge 崩溃 | `Cannot read properties of undefined (reading 'className')` | `outcomeStatus` / `confidence` 为 `undefined` 或不在枚举中 | ① 入库时必须填 `outcomeStatus: "success"`、`confidence: "high"` ② 组件用 `?? fallback` 兜底 |
| inventory 字段缺失 | 入库脚本报错 | 旧脚本引用不存在的 `inventory` 字段 | 移除该字段，使用正确的可选字段列表 |
| ❌ 走 categories 中间结构 + fix 脚本 | 列表页 500：`Cannot read properties of undefined (reading 'displayName')` | 第3步只存 `categories.industries` 为 slug 数组、`sources[].type:"report"`，第5步修复若遗漏即脏数据 | **彻底弃用**：第3步直接用 Python 生成含完整 `industry`/`scenarios` 对象的 `CaseStudy`，第4步 `insert-cases.mjs` 直接入库 |
| `organization.type` 写成 `"企业"` | 虽运行时不一定崩，但类型非 `OrgType` 合法值 | 用了中文“企业”而非 `"private"`/`"soe"`/`"foreign"`/`"sme"` | 用合法 `OrgType` 值 |
| PowerShell 下 node 无输出 | 误以为脚本没跑/没插入 | stdout 被 CLIXML 进度流吞掉 | 以 `scripts/insert-run.log` 文件日志（INSERT/SKIP/Done）为准，或用 node -e 查 DB 计数 |

---

## 脚本文件归档

| 文件 | 用途 | 是否保留 |
|------|------|----------|
| `scripts/gen_xxx_cases.py` | Python 生成**完整** CaseStudy JSON（内嵌 catalog 对象） | 保留（每个报告一份） |
| `scripts/extracted/xxx-cases.json` | 生成结果 | 保留 |
| `scripts/insert-cases.mjs` | **通用**入库脚本（按 title 去重，写 `insert-run.log`） | 保留 |
| `scripts/fix-xxx-schema.mjs` | 老 schema 修复脚本 | ⛔ 已废弃，仅旧数据兼容时复用 |
| `report/xxx.pdf` | 原始 PDF | 保留 |
| `report_ocr/xxx.txt` | OCR 文本 | 保留 |
| `scripts/insert-run.log` | 入库执行日志（判断成败） | 保留 |

临时诊断/调试脚本（如 `fix_ecom_json.py`、`check_bytes.py`、`verify-data.mjs`）**执行完后删除**。
