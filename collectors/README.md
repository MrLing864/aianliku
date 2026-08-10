# 案例采集器（collectors）

独立于主站 `src/` 与一次性运维脚本 `scripts/`，用于**自动采集 AI 应用案例**：
覆盖云厂商「客户案例」栏目、政府机关官网、上市公司官网三类来源，
经 LLM 改写/抽取为结构化数据后 upsert 进 CloudBase（厂商入 `case_studies`，政府/公司入 `cases`，状态均为 `published`，直接发布）。

## 设计要点

- **解析页面级异步数据**：腾讯云案例页按行业分 tab 且有多页，直接读取 `window['__ASYNC_DATA__']` 获取全部 158 个案例入口，不依赖脆弱选择器。
- **阿里云：客户端筛选 + SSR 详情**：列表页的「人工智能与机器学习」「AI」分类是复选框客户端行为（需点击隐藏 `<input>` 触发），用 Playwright 发现真实结果卡片；详情页为服务端渲染（普通 `fetch` 即可抽取正文），公司名从 `h1`/标题多候选评分提取。
- **LLM 改写避免侵权**：抓取原始 HTML → DeepSeek 用自己的语言改写（替换同义词、调整句式、概括要点），保留事实但表达方式原创。
- **严格 AI 相关性过滤**：先用轻量 LLM 判断案例是否真正使用 AI/大模型/机器学习/计算机视觉/NLP/OCR/推荐等；仅使用云服务器/数据库/CDN/通用 SaaS/广告/建站的案例会被过滤。
- **字段对齐 catalog**：行业、场景自动映射到 `src/lib/catalog.ts` 中的完整对象，businessFunctions 限制为 catalog 中文值。
- **直接发布**：产出 `contentStatus: "published"`。
- **去重（V2 统一服务）**：采集器不再直连写 `cases`。`upsertCase` 改为调用网站后台统一去重接入端点 `/api/internal/collector-ingest`，由 `src/lib/dedup` 的 `runDedupPipeline` 处理来源幂等（`sources` 集合）、来源片段拆分（`source_case_segments`）、企业主体归一（`organizations`）、项目指纹与候选检索、规则评分 + DeepSeek 两阶段判断、重复决策。高/中疑似重复进入后台审核队列，不自动发布或合并。灰度开关 `DEDUP_V2_MODE=observe|enforce`（默认 observe）。采集器需配置 `INTERNAL_API_BASE_URL` 与 `INTERNAL_API_KEY` 与网站一致。
- **固定入口优先（政府/公司采集）**：不再依赖泛搜碰运气。每家政府/企业都在 `sources.ts` 沉淀**官网固定入口映射**（"宣传/吹牛/典型案例"栏目 URL + 类型 list/detail），抓取时直接进这些入口，命中率与可维护性大幅提升；入口失效由健康检查（落盘 `*-discover-health.json`）标记，供人工更新。sources 无入口或全失败时回退 `searchCases` 泛搜兜底。
- **SPA 渲染兜底**：固定入口直抓为静态 HTML；若抽到的详情链接为空或全为 `#`/`javascript:`（React/Vue 单页应用常见，如讯飞 cases、阿里 news），则自动用 Playwright 渲染页面（单例 chromium 复用、`--no-sandbox`、20s 超时）后再抽一次。仅"静态抽空"时触发，不拖慢整体流程。镜像需含 `playwright` + chromium（采集器镜像已具备）。

## 目录结构

```
collectors/
  lib/
    fetch.ts       # 带 UA/超时/重试/并发限制的 HTML 抓取（mapLimit / canFetch / sleep / discoverUrls / fetchHtml）
    cloudbase.ts   # 采集入库网关：调用网站后台统一去重接入端点 /api/internal/collector-ingest（HTTP API + x-internal-key 鉴权），不再直连 CloudBase 写 cases
    extract.ts     # DeepSeek 两步处理：AI 相关性判断 + 结构化抽取/改写（支持厂商名参数）
    normalize.ts   # 映射为符合 CaseStudy 结构的入库对象（支持厂商名参数）
    catalog-map.ts # 行业/场景/职能与 catalog 的映射
    aliyun.ts      # 阿里云列表发现（Playwright 点击筛选）+ 详情页抽取 + 公司名提取
    runlog.ts      # 统一运行记录器，写入 CloudBase `collector_runs` 集合（采集进度可视化）
    scaffold_columns.ts # 栏目发现辅助脚本：扫域名出候选"案例/新闻"栏目，供人工确认后填入 sources.ts
  vendors/
    index.ts       # 厂商数据源配置（启用/禁用 + URL + 自定义 discoverUrls / discoverListItems）
  government/      # 政府机关 AI 案例采集（全国各省份，落地 `cases` 集合）
    config.ts / search.ts / discover.ts / enrich.ts / run.ts / sources.ts（官网固定入口映射）
  companies/       # A股+港股上市公司 AI 案例采集（落地 `cases` 集合，带进度游标）
    config.ts / list.ts / search.ts / discover.ts / enrich.ts / progress.ts / run.ts / sources.ts（官网固定入口映射）
  run.ts           # 厂商采集编排入口（多厂商分发）
```

### 官网固定入口映射（`government/sources.ts` / `companies/sources.ts`）

人工/半人工沉淀的采集资产，结构：

```ts
type EntryType = "list" | "detail";
interface SourceColumn { name: string; url: string; type: EntryType; detailPattern?: string; verified: boolean; }
// 政府：{ province, domain, columns: SourceColumn[] }
// 企业：{ name, domain, columns: SourceColumn[] }
```

- `verified: false` = 工具猜测候选，待人工确认后改 `true`。
- `type:"list"` = 列表页，用 `discoverUrls` 抽详情；`type:"detail"` = 已是详情页直接抽。
- 抓取时优先走这些入口；无入口/全失败时回退泛搜。入口健康落盘 `/var/log/*-discover-health.json`。

**维护流程**：先用 `tsx collectors/lib/scaffold_columns.ts <域名>` 扫候选栏目 → 人工挑选真入口填进 `sources.ts` 并标 `verified=true`。

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

# 扫描某企业/政府官网，输出疑似"案例/新闻"栏目候选（供人工挑入 sources.ts）
npx tsx collectors/lib/scaffold_columns.ts icbc.com.cn
npx tsx collectors/lib/scaffold_columns.ts gd.gov.cn --limit=30
```

### 政府机关 / 上市公司采集

这两类落地到 `cases` 集合（与厂商 `case_studies` 不同），只有加 `--write-db` 才会写库，
默认只输出到 JSON / 运行记录器（便于先在 `collector_runs` 看效果）。

```bash
# 政府机关案例（全国省份，默认每日上限 GOV_DAILY_CAP=60）
npm run collect:gov -- --write-db            # 正式入库
npm run collect:gov -- --dry-run --limit=3 --provinces=广东,江苏 --out=/tmp/gov.json

# 上市公司案例（A股+港股，带进度游标循环）
npx tsx collectors/companies/run.ts --write-db                       # 今日循环（按 DAILY_COMPANY_LIMIT）
npx tsx collectors/companies/run.ts --companies=宁德时代,比亚迪 --write-db   # 手动指定企业
npx tsx collectors/companies/run.ts --dry-run --limit=5 --out=/tmp/company.json
```

> 注意：`package.json` 只内置了 `collect`（厂商）与 `collect:gov`（政府）脚本，
> 上市公司需直接用 `npx tsx collectors/companies/run.ts`。政府/公司采集都依赖根目录 `.env`
> 中的 `DEEPSEEK_API_KEY` 与 `CLOUDBASE_*`，且需要 `Node ≥ 18`（ECMAScript 动态导入）。

## 数据源状态

| 厂商 | 列表页 | 状态 | 说明 |
|------|--------|------|------|
| 腾讯云 | `https://cloud.tencent.com/customer` | ✅ 启用 | SSR，解析 `__ASYNC_DATA__` 获取全部行业 tab 与详情页 |
| 华为云 | `https://www.huaweicloud.com/cases` | ✅ 启用 | SSR，可继续扩展详情页抽取 |
| 阿里云 | `https://www.aliyun.com/customer-stories/customer-case-index` | ✅ 启用 | Playwright 点击「人工智能与机器学习」「AI」筛选发现 22 个案例；详情页 SSR 抽取，公司名多候选评分 |
| 百度智能云 | `https://cloud.baidu.com/case.html` | ⛔ 禁用 | 列表页 404，正确路径待定位 |
| 政府机关 | `collectors/government/` | ✅ 启用 | 官网固定入口优先（`sources.ts`）+ 泛搜兜底，落地 `cases`，每日上限约 60 |
| 上市公司 | `collectors/companies/` | ✅ 启用 | 官网固定入口优先（`sources.ts`）+ 泛搜兜底，A股+港股名单循环采集，落地 `cases`，带进度游标 |

## 远端部署（Lighthouse 服务器）

采集器与网站是两个独立 Docker 部署，不要混用：

| 组件 | 部署目录 | 镜像 / 容器 | 说明 |
|------|----------|-------------|------|
| 网站 `aianliku` | `~/aianliku_YYYYMMDDHHMMSS` | 容器 `aianliku`（80→3000） | Next.js 站点，**改 `src/` 才动它** |
| 采集器 `aianliku-collector` | `~/_collector_deploy_YYYYMMDDHHMMSS` | 镜像 `aianliku-collector:latest` | 跑 `collectors/` + `src/lib/catalog.ts`，**改 `collectors/` 才动它** |

- 采集器容器是「按需任务型」，不是常驻；crontab（`collect-gov.sh` / `collect-company.sh` / `collect-daily.sh` / `backup-db.sh`）
  通过 `-v /root/aianliku_20260727103648/.env:/app/.env` 把密钥挂进容器再跑对应入口。

### 数据库每日全量备份（防误删/误操作）

数据是最重要的资产。此前曾因 `sourceUrl` 归一化误删 2078 条案例且 CloudBase 无回收站、无法 UNDO，
故新增**每日全量备份**机制。

- **脚本**：`scripts/backup-db.mjs`（本地仓库，纯独立逻辑，仅依赖 `@cloudbase/node-sdk` 与 node 内置模块）。
  服务器副本：`/root/aianliku_20260727103648/backup-db.mjs`（由 `backup-db.sh` 挂载进容器执行）。
- **调度**：crontab `0 6 * * * /bin/bash /root/aianliku_20260727103648/backup-db.sh`，每天 06:00 在全部采集任务之后执行。
- **流程**：用 `aianliku-collector` 镜像 `docker run --rm`，按 `_id` 游标分批（每页 1000）全量拉取 `cases` 集合，
  导出为 `/root/aianliku_backups/cases-YYYYMMDD-HHMMSS.json`（含 `exportedAt` / `count` / `docs`）。
- **保留策略**：默认保留最近 3 份（3 天），超出自动删除最旧文件。
- **恢复**：误删后可用 `docker run -v ... aianliku-collector npx tsx scripts/import-json.ts` 或临时脚本把某份备份
  upsert 回 `cases`（`upsertCase` 按 `dedupKey` 去重，不会重复创建）；恢复前务必先确认备份时间点在误删之前。
- **手动触发**：`bash /root/aianliku_20260727103648/backup-db.sh`；日志在 `/root/aianliku_20260727103648/backup-db.log`。
- 改了 `collectors/` 后，要把**完整改动目录**同步到 `_collector_deploy_*` 再 `docker build -f Dockerfile.collector -t aianliku-collector:latest .`。
  Dockerfile 只 `COPY collectors/` 与 `COPY src/lib/catalog.ts`，所以缺文件（如 `government/discover.ts`）会导致
  `Cannot find module './discover'` —— 务必把整个子目录同步过去，不要只传单个改动文件。

## ⚠️ 已知坑（已修复，记录备查）

1. **CloudBase 操作符作用域错误**：`lib/cloudbase.ts` 里不能用 `collection.command.in(...)`，
   `@cloudbase/node-sdk` 的操作符挂在 `db.command` 上，应写为 `db.command.in(...)`。
   旧写法会报 `Cannot read properties of undefined (reading 'in')`，且只在真正执行去重查询时才暴露。
2. **`government/run.ts` 跨模块导入 `sleep` / `canFetch` 为 undefined**：ESM 下静态
   `import { sleep, canFetch } from "../lib/fetch"` 在 `run.ts` 求值期解析为 undefined
   （报 `is not a function`，且只在 `mapLimit` 闭包内调用时触发）。
   修复方式：在 `government/run.ts` 内本地定义 `sleep`，`canFetch` 也优先本地实现，只保留
   来自 `../lib/fetch` 的 `mapLimit`。如确需其他导出，改用运行时 `await import("../lib/fetch")`。
3. **`withRetry` 容错**：`cloudbase.ts` 的 `existingDedupKeys` / `existingSourceUrls` 已包 `withRetry`，
   瞬时网络抖动会被自动重试（日志会打印 `xxx 失败（第 1 次），重试中...`）。
4. **政府/公司采集旧逻辑命中率低（已重构）**：原实现靠泛搜 + 宽 candidate 上限，命中多为媒体通稿/软文，
   且 company 全量分支因 `searchCases(q, 2, "")` 的 `domain=""` 被 `matchesDomain` 判空而形同虚设。
   现已改为**官网固定入口优先**（`sources.ts`），泛搜仅兜底；`scaffold_columns.ts` 辅助人工沉淀入口。
   入口失效由 `/var/log/*-discover-health.json` 暴露，需人工更新 `sources.ts` 的 `verified` 与 URL。
5. **`matchesDomain` 对空 domain 恒 false**：`lib/search.ts` 的 `matchesDomain(url, domain)` 当 `domain` 为空时
   几乎全部返回 false（等价于"不匹配"）。因此任何"按官网限定"的搜索都必须传真实 `domain`，不能传 `""`。

## 新增 / 修复一个数据源

1. 编辑 `vendors/index.ts`，修改 `listUrl` 或将 `enabled` 置为 `true`。
2. 若列表页是 SSR 但入口在 JS 异步数据里，实现 `discoverUrls(html, baseUrl)`。
3. 先用 `--out` 输出文件检查质量，确认 AI 相关性过滤准确后再 `--write-db`。
