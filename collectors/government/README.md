# 政府机关 AI 应用案例定时采集器

每天凌晨 3 点爬取全国各省份/城市政府机关发布的 2025/2026 年典型 AI 应用案例，
抽取结构化字段、补齐缺失信息、生成编辑点评，并去重写入 CloudBase `cases` 集合。

## 需求落地对照

| 需求 | 实现位置 |
|------|----------|
| ① 去重：已存在不插入 | `lib/cloudbase.ts#upsertCase` 按 `dedupKey`（标题归一化+域名+年份）去重；`existingDedupKeys` 预过滤 |
| ② 缺失字段去权威网补采 | `enrich.ts#enrichMissingFields`，仅接受 `config.ts` 白名单域名（.gov.cn / 人民网 / 新华网 / 部委官网） |
| ③ 编辑点评 ≤100 字 | `enrich.ts` 抽取 schema 的 `editorComment`，DeepSeek 生成，prompt 强制 ≤100 字 |
| ④ 1 行业 + 1 场景 | `enrich.ts` 抽取时 `industrySlug`/`scenarioSlug` 各取恰好一个，来自 `src/lib/catalog` |
| ⑤ 发布年 vs 实施年 | `publishedAt` / `implementedAt` 分别填发布年与实施年，仅一个年份时只填发布年 |
| ⑥ 来源 = 网址名 + 超链接 | `enrich.ts` 组装 `sources:[{type:"government_website", title, url}]` |

## 目录

- `config.ts` — 省份清单、权威域名白名单、搜索 query 构造、每日上限
- `search.ts` — 搜索引擎封装（默认 Bing，可配 `GOV_SEARCH_API_URL` 走自建 API）
- `discover.ts` — 按省份×年份×关键词搜索，产出候选 URL
- `enrich.ts` — 抓取详情 + AI 抽取 + 补采 + 点评 + 行业/场景判定
- `run.ts` — 编排入口

## 运行

```bash
# 试运行（不写库，输出到 JSON）
npm run collect:gov -- --dry-run --limit=3 --provinces=广东,江苏 --out=/tmp/gov.json

# 正式入库
npm run collect:gov -- --write-db
```

环境变量：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`（可选）、`GOV_SEARCH_API_URL`（可选）、`GOV_DAILY_CAP`（默认 60）。

## Lighthouse crontab 部署

在服务器宿主机（CentOS 7）配置（容器通过 -v 挂载源码目录时路径需对应）：

```bash
crontab -e
# 每天 03:00 运行，日志落地到 /var/log/gov-collect.log
0 3 * * * cd /root/aianliku_20260727103648/collectors && /usr/bin/node ../node_modules/.bin/tsx government/run.ts --write-db >> /var/log/gov-collect.log 2>&1
```

注意：
- 确保 cron 环境能读到 `.env`（脚本内 `dotenv.config()` 会加载项目根 .env）。
- `DEEPSEEK_API_KEY` 写入 `.env` 或 cron 的 `ENV`。
- 首次部署建议先 `--dry-run` 观察候选量与抽取质量，再切 `--write-db`。
- 若 Bing 搜索被反爬/墙，配置 `GOV_SEARCH_API_URL` 走自建搜索代理。

## 数据落库

写入 `cases` 集合，字段与现有厂商案例一致，前台 `src/lib/catalog` 行业/场景清单可直接展示；
`sourceType:"government"` 用于区分来源，`dedupKey` 用于幂等。
