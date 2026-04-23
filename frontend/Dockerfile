# ── Frontend Dockerfile (멀티스테이지 빌드) ──────────────────
# Stage 1 (builder): node:24-alpine — npm ci + vite build
# Stage 2 (serve):   nginx:alpine   — dist 정적 파일 서빙
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Vite 빌드 ────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# 의존성 먼저 복사 (레이어 캐시)
COPY package*.json ./
RUN npm ci

# 소스 전체 복사 후 빌드
COPY . .
RUN npm run build
# 결과: /app/dist

# ── Stage 2: nginx 정적 서빙 ──────────────────────────────────
FROM nginx:alpine

LABEL description="Blog Frontend — React 19 + Vite → nginx static"

# SPA 라우팅 설정 (React Router fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Stage 1 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
