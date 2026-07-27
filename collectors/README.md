# 案例采集器（collectors）

独立于主站 `src/` 与一次性运维脚本 `scripts/`，用于**自动从云厂商「客户案例」栏目采集企业 AI 应用案例**，
经 LLM 改写/抽取为结构化数据后 upsert 进 CloudBase `case_studies` 集合（状态为 `published`，直接发布）。

## 设计要点

- **解析页面级异步数据**：腾讯云案例页按行业分 tab 且有多页，直接读取 `window['__ASYNC_DATA__']` 获取全部 158 个案例入口，不依赖脆弱选择器。
- **阿里云：客户端筛选 + SSR 详情**：列表页的「人工智能与机器学习」「AI」分类是复选框客户端行为（需点击隐藏 `<input>` 触发），用 Playwright 发现真实结果卡片；详情页为服务端渲染（普通 `fetch` 即可抽取正文），公司名从 `h1`/标题多候选评分提取。
- **LLM 改写避免侵权**：抓取原始 HTML → DeepSeek 用自己的语言改写（替换同义词、调整句式、概括要点），保留事实但表达方式原创。
- **严格 AI 相关性过滤**：先用轻量 LLM 判断案例是否真正使用 AI/大模型/机器学习/计算机视觉/NLP/OCR/推荐等；仅使用云服务器/数据库/CDN/通用 SaaS/广告/建站的案例会被过滤。
- **字段对齐 catalog**：行业、场景自动映射到 `src/lib/catalog.ts` 中的完整对象，businessFunctions 限制为 catalog 中文值。
- **直接发布**：产出 `contentStatus: "published"`。
- **去重**：按 `slug`（企业 + 标题）去重，已存在则更新。

## 目录结构

```
collectors/
  lib/
    fetch.ts       # 带 UA/超时/重试/并发限制的 HTML 抓取
    cloudbase.ts   # CloudBase 连接、自动建集合、slug 去重 upsert
    extract.ts     # DeepSeek 两步处理：AI 相关性判断 + 结构化抽取/改写（支持厂商名参数）
    normalize.ts   # 映射为符合 CaseStudy 结构的入库对象（支持厂商名参数）
    catalog-map.ts # 行业/场景/职能与 catalog 的映射
    aliyun.ts      # 阿里云列表发现（Playwright 点击筛选）+ 详情页抽取 + 公司名提取
  vendors/
    index.ts       # 数据源配置（启用/禁用 + URL + 自定义 discoverUrls / discoverListItems）
  run.ts           # 采集编排入口（多厂商分发）
  import-json.ts   # 将 run.ts 输出的 JSON 写入数据库
```

## 环境变量

在 `.env` 中配置：

```
DEEPSEEK_API_KEY=sk-...
CLOUDBASE_ENV=your-env-id
CLOUDBASE_SECRET_ID=...
CLOUDBASE_SECRET_KEY=...
```

## 用法

```bash
# 采集并输出到 JSON（不入库）
npm run collect -- --vendor=tencent --out=collectors/tencent-cases.json
npm run collect -- --vendor=aliyun --out=collectors/aliyun-cases.json

# 采集并直接写入 CloudBase
npm run collect -- --vendor=tencent --write-db
npm run collect -- --vendor=aliyun --write-db

# 限制数量用于调试
npm run collect -- --vendor=aliyun --limit=5 --out=collectors/test.json

# 将已采集的 JSON 导入数据库
npx tsx collectors/import-json.ts --file=collectors/tencent-cases.json
npx tsx collectors/import-json.ts --file=collectors/aliyun-cases.json
```

## 数据源状态

| 厂商 | 列表页 | 状态 | 说明 |
|------|--------|------|------|
| 腾讯云 | `https://cloud.tencent.com/customer` | ✅ 启用 | SSR，解析 `__ASYNC_DATA__` 获取全部行业 tab 与详情页 |
| 华为云 | `https://www.huaweicloud.com/cases` | ✅ 启用 | SSR，可继续扩展详情页抽取 |
| 阿里云 | `https://www.aliyun.com/customer-stories/customer-case-index` | ✅ 启用 | Playwright 点击「人工智能与机器学习」「AI」筛选发现 22 个案例；详情页 SSR 抽取，公司名多候选评分 |
| 百度智能云 | `https://cloud.baidu.com/case.html` | ⛔ 禁用 | 列表页 404，正确路径待定位 |

## 新增 / 修复一个数据源

1. 编辑 `vendors/index.ts`，修改 `listUrl` 或将 `enabled` 置为 `true`。
2. 若列表页是 SSR 但入口在 JS 异步数据里，实现 `discoverUrls(html, baseUrl)`。
3. 先用 `--out` 输出文件检查质量，确认 AI 相关性过滤准确后再 `--write-db`。
