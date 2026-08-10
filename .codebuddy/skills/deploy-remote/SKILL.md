# 部署到远端 Lighthouse 服务器 Skill

用户说「部署 / 发布到服务器 / deploy」时，按本流程把本地改动发布到腾讯云轻量应用服务器（Lighthouse）。

---

## 架构背景（务必先读，避免踩坑）

服务器 `lhins-o9ad2tj9`（地域 `ap-guangzhou`，CentOS，公网 `43.136.108.45`）上跑 **两套独立的 Docker 部署**：

| 组件 | 部署目录 | 容器/镜像 | 说明 |
| --- | --- | --- | --- |
| 网站 `aianliku` | `~/aianliku_YYYYMMDDHHMMSS` | 容器 `aianliku`（80→3000） | Next.js 公开站，**本次一般不动** |
| 采集器 `aianliku-collector` | `~/_collector_deploy_YYYYMMDDHHMMSS` | 镜像 `aianliku-collector:latest` | `collectors/` 脚本 + `src/lib/catalog.ts` |

⚠️ **关键踩坑点**：
1. **本次改动 `collectors/lib/cloudbase.ts` 属于「采集器」，不是网站**。改 `collectors/` 就要重建 `aianliku-collector` 镜像，而不是动网站容器。
2. 采集器 Dockerfile（`Dockerfile.collector`）构建上下文只 `COPY collectors/` 和 `COPY src/lib/catalog.ts`，**不复制整个项目**。所以不能用全量上传，否则镜像会缺依赖/缺文件。
3. 采集器容器之前并非常驻运行（`docker ps` 中无该容器），它是按需跑 `npx tsx collectors/run.ts` 的任务型镜像。部署只需重建镜像，下次运行即生效。
4. Lighthouse 的 `deploy_project_preparation` 会**上传整个文件夹**，不适合只改一个文件。正确做法：本地只建一个含改动文件的临时补丁目录，上传后 `cp` 到部署目录，再 build。
5. **HTTPS 已在宿主机 Nginx 上配置（见下方「HTTPS / Nginx 现状」）**。`aianliku` 网站容器**必须**用 `-p 127.0.0.1:3000:3000` 绑定，绝不能用 `-p 80:3000` 或 `-p 3000:3000`，否则会抢回宿主机 80 端口，导致 Nginx 无法监听 80/443、HTTPS 失效。

### HTTPS / Nginx 现状（重要，部署网站时必须遵守）

服务器已在宿主机安装 Nginx（`/etc/nginx/`），由它做 HTTPS 终结并反代到网站容器：

- 证书：`/etc/nginx/ssl/aianliku.com_bundle.pem` + `/etc/nginx/ssl/aianliku.com.key`（TrustAsia DV，约 2026-10-25 到期，到期前需在证书平台续期并替换这两个文件后 `nginx -s reload`）。
- 配置：`/etc/nginx/conf.d/aianliku.conf` —— 443 反代 `127.0.0.1:3000`；80 做 `return 301 https://$host$request_uri` 跳转。
- 默认 `/etc/nginx/nginx.conf` 里原 `server { listen 80; }` 已注释，避免与 80 跳转冲突（备份在 `nginx.conf.bak.*`）。
- Nginx 已 `systemctl enable` + `start`，防火墙已放通 80/443。

**重建 `aianliku` 容器的唯一正确命令**：
```bash
docker run -d --name aianliku -p 127.0.0.1:3000:3000 --restart unless-stopped aianliku npx next start -p 3000
```
改完端口后若 Nginx 未运行，执行 `systemctl start nginx` 并 `nginx -t` 校验。
5. **`collectors/government/` 子目录必须整体同步**：部署目录里曾只残留 `config.ts` + `run.ts`，缺 `discover.ts`/`enrich.ts`/`search.ts`，导致 `Cannot find module './discover'`。凡是改动了某采集子目录，**把该子目录整个 cp 过去**，不要只传单文件。

---

## 采集器代码级坑（部署后跑任务必看，已修但易复发）

部署后若跑 `government/run.ts` 或 `companies/run.ts` 报以下错，说明 `collectors/` 代码有回归：

- ❌ `Cannot read properties of undefined (reading 'in')` @ `cloudbase.ts` → 把 `collection.command.in(...)` 改成 **`db.command.in(...)`**（`@cloudbase/node-sdk` 操作符挂在 `db.command`）。
- ❌ `(0 , import_fetch.sleep) is not a function` / `canFetch is not a function` @ `government/run.ts` → **ESM 下从 `../lib/fetch` 静态导入的 `sleep`/`canFetch` 求值期为 undefined**。修复：在 `government/run.ts` 内**本地实现** `sleep` 和 `canFetch`（只保留 `mapLimit` 来自 `../lib/fetch`）。若其余采集入口（`companies` 等）也静态导入这两个符号，同样本地化。
- 验证命令（服务器）：
  ```bash
  IMG=aianliku-collector; ENV=/root/aianliku_20260727103648/.env
  /usr/bin/docker run --rm -v $ENV:/app/.env $IMG npx tsx collectors/government/run.ts --write-db   # 政府
  /usr/bin/docker run --rm -v $ENV:/app/.env $IMG npx tsx collectors/companies/run.ts --write-db      # 公司
  ```
  只看 `--write-db` 才入库；成功标志是日志出现 `[db] 入库成功：...` 与 `数据库写入完成：新建 N`。

---

## 部署流程（5 步）

### 第 0 步：确认改动归属 + 实例信息

```powershell
cd c:\Users\Administrator\Desktop\aianliku\code
git diff --stat          # 看改了哪些文件
```

- 若改动在 `collectors/` 或 `src/lib/catalog.ts` → 目标是 **采集器**。
- 若改动在 `src/`（页面/API）或 `public/` → 目标是 **网站**（流程另行处理，本 skill 聚焦采集器）。

用 Lighthouse 集成工具确认实例（不要硬编码地域，先盘点）：
- `analyze_lighthouse_instances` → 拿到地域（如 `ap-guangzhou`）。
- `describe_running_instances`（Region=该地域）→ 拿到 `InstanceId`（如 `lhins-o9ad2tj9`）和公网 IP。

> 集成 ID 固定为 `lighthouse`。所有服务器操作走 `call_integration` 工具，不要 ssh。

### 第 1 步：在服务器上定位部署目录

```bash
# 通过 execute_command 在服务器执行
ls -d ~/_collector_deploy_*   # 采集器部署目录（取最新时间戳那个）
ls -d ~/aianliku_*            # 网站部署目录（参考用）
docker images aianliku-collector
docker ps -a --format '{{.Names}} {{.Image}} {{.Status}}'
```

记下采集器部署目录，后续用 `$DEPLOY` 指代（如 `~/_collector_deploy_20260727150948`）。

### 第 2 步：本地建临时补丁目录并上传

> 只上传改动文件，保持相对路径与部署目录一致（例如 `collectors/lib/cloudbase.ts`）。

```powershell
# 本地：建补丁目录，复制改动文件（按实际改动调整路径）
$err = $null
mkdir -p C:/deploy_tmp/collectors/lib
copy collectors\lib\cloudbase.ts C:\deploy_tmp\collectors\lib\cloudbase.ts
```

```json
// call_integration: lighthouse / deploy_project_preparation
{
  "FolderPath": "C:/deploy_tmp",
  "InstanceId": "lhins-o9ad2tj9",
  "Region": "ap-guangzhou",
  "ProjectName": "collector-patch"
}
```

记下返回的上传路径（如 `/root/deploy_tmp_20260808102856`），后续用 `$PATCH` 指代。

### 第 3 步：cp + 备份 + 校验

```bash
set -e
DEPLOY=~/_collector_deploy_20260727150948   # 第1步确认的目录
PATCH=/root/deploy_tmp_20260808102856        # 第2步返回的路径
# 先看 diff，确认确实是旧→新
diff $DEPLOY/collectors/lib/cloudbase.ts $PATCH/collectors/lib/cloudbase.ts || true
# 备份旧文件
cp $DEPLOY/collectors/lib/cloudbase.ts $DEPLOY/collectors/lib/cloudbase.ts.bak.$(date +%Y%m%d%H%M%S)
# 覆盖
cp $PATCH/collectors/lib/cloudbase.ts $DEPLOY/collectors/lib/cloudbase.ts
# 校验关键代码已写入
grep -c withRetry $DEPLOY/collectors/lib/cloudbase.ts   # 应为 5（按实际改动调整）
```

### 第 4 步：重建采集器镜像

```bash
set -e
DEPLOY=~/_collector_deploy_20260727150948
cd $DEPLOY
docker build -f Dockerfile.collector -t aianliku-collector:latest . 2>&1 | tail -20
# npm/playwright/apt 层都已 CACHED，通常几秒完成
# 移除旧的采集器容器（若存在）
(docker rm -f aianliku-collector 2>/dev/null && echo removed) || echo 'no old collector container'
```

> 构建层大多命中缓存，只有 `COPY collectors/` 和 `COPY src/lib/catalog.ts` 两层会重做。

### 第 5 步：校验 + 清理 + 记录

```bash
# 在镜像内确认新代码已打入
docker run --rm --entrypoint sh aianliku-collector:latest -c 'grep -c withRetry /app/collectors/lib/cloudbase.ts'
# 清理临时上传目录与备份
rm -rf /root/deploy_tmp_20260808102856
ls ~/_collector_deploy_*/collectors/lib/cloudbase.ts.bak.* 2>/dev/null | xargs -r rm -f
docker images aianliku-collector
```

最后调用 `deploy_success`（integrationId=lighthouse）记录部署：
```json
{ "InstanceName": "CentOS-DIYt", "InstanceId": "lhins-o9ad2tj9", "URL": "http://43.136.108.45" }
```

---

## 收尾说明（回复用户时带上）

- 改动若仅涉及采集器脚本，不影响线上网站（`aianliku` 容器无需重启）。
- 采集器镜像已更新，下次运行采集任务即自动使用新逻辑。
- 若需立即验证：可在服务器上 `docker run --rm aianliku-collector:latest npx tsx collectors/run.ts`（注意环境变量 `.env` 需在容器内可用，按需挂载）。

## 常见错误回顾

- ❌ 把 `collectors/` 改动当成网站改动去重建 `aianliku` 容器 → 白白构建 + 无关。
- ❌ 直接全量上传整个项目到部署目录 → Dockerfile 上下文不匹配、镜像缺文件。
- ❌ 硬编码地域 `ap-shanghai` → 实际实例在 `ap-guangzhou`，先用 `analyze_lighthouse_instances` 盘点。
- ❌ 改完不校验 → 必须 `grep` / `docker run --rm` 确认新代码进镜像。
- ❌ 不备份旧文件 → 先 `cp ...bak.<时间戳>` 再覆盖，便于回滚。
- ❌ 重建 `aianliku` 网站容器时用 `-p 80:3000` / `-p 3000:3000` → 抢回宿主机 80 端口，Nginx 无法监听 80/443，**HTTPS 整站失效**。必须用 `-p 127.0.0.1:3000:3000`，让 Nginx 反代 `127.0.0.1:3000`。
- ❌ 证书快到期（2026-10-25）忘了续期 → 提前在证书平台续期，下载 Nginx 格式替换 `/etc/nginx/ssl/` 两个文件，`nginx -s reload` 生效。
