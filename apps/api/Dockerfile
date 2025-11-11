# Simple Dockerfile for API (optional for deployment)
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* .npmrc* ./ 2>/dev/null || true
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
EXPOSE 4000
CMD ["node", "dist/index.js"]
