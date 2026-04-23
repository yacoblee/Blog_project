-- ════════════════════════════════════════════════════════════════
-- DB 초기화 스크립트 (Docker 첫 실행 시 1회만 실행)
-- postgres:16-alpine → /docker-entrypoint-initdb.d/ 자동 실행
--
-- ⚠️  이미 blog-db-data 볼륨에 데이터가 있으면 실행되지 않음
--     (볼륨 삭제 후 재실행: docker compose down -v)
-- ════════════════════════════════════════════════════════════════

-- 확장 (UUID 등 필요 시)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 실제 테이블 생성은 backend/migrations/*.sql 이 담당합니다.
-- 여기서는 추가 초기 설정만 작성하세요.

-- 예: 타임존 설정
SET timezone = 'Asia/Seoul';
