FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# 规范主域名：必须 https，否则搜索引擎会把 IP/localhost 当作主站，分散权重。
# 构建时内联进客户端包（NEXT_PUBLIC_*），同时 SITE.url 有二次校验兜底。
ARG SITE_URL=https://aianliku.com
ENV NEXT_PUBLIC_SITE_URL=$SITE_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS=--max-old-space-size=1536 npm run build
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
