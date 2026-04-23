# ── Backend Dockerfile ─────────────────────────────────────────
# Node.js 24 Alpine (경량 이미지)
# 엔트리포인트: migrate.js 실행 후 app.js 시작
# ──────────────────────────────────────────────────────────────

FROM node:24-alpine

# 빌드 메타데이터
LABEL maintainer="Blog Project"
LABEL description="Express API Server — Node.js 24"

WORKDIR /app

# package.json 먼저 복사 → npm ci 레이어 캐시 활용
COPY package*.json ./

# 프로덕션 의존성만 설치 (devDependencies 제외)
# tiptap/jsdom은 importNotion 스크립트에서만 사용 — 런타임 불필요
RUN npm ci --omit=dev

# 소스 코드 복사
COPY src/        ./src/
COPY migrations/ ./migrations/

# 4000번 포트 명시 (실제 바인딩은 compose에서)
EXPOSE 4000

# 헬스체크용 wget 확인 (alpine 기본 포함)
# 실행: 마이그레이션 → 서버 시작
CMD ["sh", "-c", "node migrations/migrate.js && node src/app.js"]
