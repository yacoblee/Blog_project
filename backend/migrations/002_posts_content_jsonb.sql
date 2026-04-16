-- ────────────────────────────────────────────────────────────
-- posts.content : TEXT(HTML/Markdown) → JSONB(Tiptap document)
-- ────────────────────────────────────────────────────────────
--
-- 변환 전략:
--   1) jsonb 형식의 content_json 신규 컬럼 추가
--   2) 기존 TEXT content 를 빈 Tiptap doc 으로 초기화
--      (HTML/Markdown 자동 변환은 별도 스크립트가 필요 — 수동 재작성 가정)
--   3) content 컬럼을 jsonb 로 교체
--
-- 운영 환경이라면 ALTER ... USING 으로 한 번에 변환할 수도 있으나,
-- 본 프로젝트는 데이터 손실 위험이 낮은 단계이므로 단순 치환합니다.
-- ────────────────────────────────────────────────────────────

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_json JSONB;

-- 기존 글: 빈 Tiptap 문서로 채움 (필요 시 수동으로 재편집)
UPDATE posts
   SET content_json = '{"type":"doc","content":[]}'::jsonb
 WHERE content_json IS NULL;

-- TEXT content 컬럼 제거
ALTER TABLE posts DROP COLUMN IF EXISTS content;

-- content_json → content 로 이름 변경
ALTER TABLE posts RENAME COLUMN content_json TO content;

-- NOT NULL + 기본값 보강
ALTER TABLE posts
  ALTER COLUMN content SET DEFAULT '{"type":"doc","content":[]}'::jsonb,
  ALTER COLUMN content SET NOT NULL;
