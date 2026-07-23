# AI案例库（AIAnLiKu）

中国企业 AI 改造案例数据库。帮助企业“看案例 → 找方向 → 做 AI”。

## 当前能力

- 公开站：首页、案例搜索/筛选、案例详情、行业与场景独立页、来源追溯、SEO 和合规页面。
- 企业 AI 体检：结构化问诊、V4-Flash 动态追问、即时核心预览、V4-Pro 最高强度异步分析、私密报告、ROI 假设、删除数据和专家预约。
- 运营后台：单管理员登录、案例编辑、DeepSeek 来源结构化、批量导入、精确幂等、相似案例复核、异步报告任务、预约管理、分类词表和审计记录。
- 无外部服务时安全降级：使用明确标识的演示案例、规则预览和只读后台；完整报告队列未配置时明确阻止提交，不会伪装成真实分析结果。

完整产品文档见 [prd/README.md](./prd/README.md)。

## 技术栈

- Next.js 16、React 19、Tailwind CSS 4、shadcn/ui
- 腾讯云 CloudBase 文档型数据库（@cloudbase/node-sdk，替代 MongoDB / MongoDB Atlas）
- DeepSeek V4-Pro / V4-Flash（直连官方 API）
- 普通异步后台任务（Route Handler 内 fire-and-forget，持久异步报告）
- Auth.js、EdgeOne Makers Blob 对象存储（可选）、腾讯云 EdgeOne Pages

## 本地运行

```bash
npm install
copy .env.example .env.local
npm run dev
```

没有配置 CloudBase 时，公开站自动使用 `src/data/demo-cases.ts` 中的演示案例（含真实企业案例 `demo:false` 与演示案例 `demo:true`）。线上生产环境使用 CloudBase 文档型数据库中的案例数据（已上线 285 条真实企业案例，均含企业规模区间与可点击来源链接）。本地开发后台账号为：

```text
admin@aianliku.local
aianliku-demo
```

生产环境不会启用该演示账号。请运行以下命令生成 Argon2id 密码哈希：

```bash
npm run admin:hash -- your-long-password
```

然后设置 `ADMIN_EMAIL`、`ADMIN_PASSWORD_HASH` 和强随机 `AUTH_SECRET`。

## CloudBase 初始化

在 `.env.local` 配置 `CLOUDBASE_ENV`、`CLOUDBASE_SECRET_ID`、`CLOUDBASE_SECRET_KEY`（控制台获取）后执行：

```bash
npm run db:setup
npm run db:seed
```

`db:setup` 验证 CloudBase 连接（CloudBase 文档型数据库的索引需在控制台管理，`ensureIndexes` 为兼容性 no-op）。`db:seed` 以 upsert 方式加入明确标识的演示案例，不会清空已有数据。关键词搜索改用 CloudBase 文档数据库的跨字段正则匹配；向量检索暂不可用，相似案例推荐降级为“同行业/同场景”匹配。

## 数据同步（cases_json → CloudBase）

批量案例的“单一可信源”是仓库内的 `cases_json/case-2025-*.json`，但公开站点读取的是 CloudBase 文档型数据库 `cases` 集合。**仅修改 JSON 不会生效，必须同步进 CloudBase。**

- 全量重建（会重置 `views` 等运行字段）：`npx tsx scripts/import-miit-cases.ts`。
- 增量同步（仅更新指定字段、保留 `views`）：`node scripts/sync-sizes.mjs`（企业规模）、`node scripts/sync-source-urls.mjs`（来源链接）等，按 `slug` 匹配写入。

来源链接字段约定：原始数据的 `originalUrl` 在导入时映射到案例来源对象的 `url` 字段（历史导入曾误取为空的 `s.url`，导致前台链接失效）；案例详情页的来源标题即为指向 `url` 的可点击超链接，新标签页打开。

## 对象存储（EdgeOne Makers Blob）

后台来源快照（网页正文 / 抓取原文）使用 EdgeOne Makers Blob 私有存储，取代收费的腾讯云 COS；免费版单账户 1GB。查看快照由服务端代理返回（天然私有），不生成短期签名 URL。

配置（构建期或 `.env.local` 设置，Makers 运行时也可由平台自动注入）：

```ini
EO_BLOB_PROJECT_ID=makers-xxxxxxxxxxxx   # EdgeOne 项目 ID（Makers 项目形如 makers-xxxx）
EO_BLOB_TOKEN=xxxxxxxx                   # 控制台 API Token Tab 创建（仅显示一次）
EO_BLOB_STORE=aianliku                   # 存储桶名，默认 aianliku
```

连通性回归（读取 `.env.local` 的 `EO_BLOB_*` 变量，做 set/get/delete 闭环）：

```bash
npm run verify:blob
```

## 部署（EdgeOne Pages）

Next.js 全栈项目，已部署至腾讯云 EdgeOne Pages（全球 Production）。`next build` 为动态/按需渲染，构建期不依赖数据库；EdgeOne 构建时会自动注入项目环境变量（CloudBase、DeepSeek 等），运行期可直接访问数据库。如需公开访问，在 EdgeOne 控制台关闭该项目的预览鉴权/访问密码或绑定自定义域名。

## 质量检查

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## 安全说明

- `.env.local`、CloudBase 密钥、DeepSeek、EdgeOne Blob（EO_BLOB_TOKEN）密钥不得提交到 Git。
- 所有后台写接口在服务端重新校验管理员会话。
- 报告 URL 使用不可猜测 token，带 `noindex`，并提供数据删除入口。
- Workflow 只接收随机 jobId；手机号、问诊原文和报告正文不进入任务事件日志。
- 除完全相同来源外，不自动合并案例；中高相似记录必须人工决策。



