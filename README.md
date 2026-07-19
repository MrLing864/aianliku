# AI案例库（AIAnLiKu）

中国企业 AI 改造案例数据库。帮助企业“看案例 → 找方向 → 做 AI”。

## 当前能力

- 公开站：首页、案例搜索/筛选、案例详情、行业与场景独立页、来源追溯、SEO 和合规页面。
- 企业 AI 体检：结构化问诊、V4-Flash 动态追问、即时核心预览、V4-Pro 最高强度异步分析、完成邮件、私密报告、ROI 假设、删除数据和专家预约。
- 运营后台：单管理员登录、案例编辑、DeepSeek 来源结构化、批量导入、精确幂等、相似案例复核、异步报告任务与通知重试、预约管理、分类词表和审计记录。
- 无外部服务时安全降级：使用明确标识的演示案例、规则预览和只读后台；完整报告队列未配置时明确阻止提交，不会伪装成真实分析结果。

完整产品文档见 [prd/README.md](./prd/README.md)。

## 技术栈

- Next.js 16、React 19、Tailwind CSS 4、shadcn/ui
- MongoDB（Atlas Search / Vector Search，索引可通过脚本初始化）
- DeepSeek V4-Pro / V4-Flash（直连官方 API）
- Vercel Workflow SDK（持久异步报告、自动重试与跨部署恢复）
- Auth.js、Resend、Cloudflare R2（可选）、Vercel

## 本地运行

```bash
npm install
copy .env.example .env.local
npm run dev
```

没有 MongoDB 时，公开站自动使用 12 条标明“演示”的匿名案例。本地开发后台账号为：

```text
admin@aianliku.local
aianliku-demo
```

生产环境不会启用该演示账号。请运行以下命令生成 Argon2id 密码哈希：

```bash
npm run admin:hash -- your-long-password
```

然后设置 `ADMIN_EMAIL`、`ADMIN_PASSWORD_HASH` 和强随机 `AUTH_SECRET`。

## MongoDB 初始化

配置 `MONGODB_URI` 后执行：

```bash
npm run db:setup
npm run db:seed
```

`db:setup` 创建普通唯一索引，并请求创建中文全文检索与 384 维案例去重向量索引；Atlas 索引异步构建，状态变为 `READY` 后再做上线验收。`db:seed` 以 upsert 方式加入明确标识的演示案例，不会清空已有数据。

## 质量检查

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## 安全说明

- `.env.local`、MongoDB URI、DeepSeek/Resend/R2 密钥不得提交到 Git。
- 所有后台写接口在服务端重新校验管理员会话。
- 报告 URL 使用不可猜测 token，带 `noindex`，并提供数据删除入口。
- Workflow 只接收随机 jobId；邮箱、问诊原文和报告正文不进入任务事件日志。
- 除完全相同来源外，不自动合并案例；中高相似记录必须人工决策。
