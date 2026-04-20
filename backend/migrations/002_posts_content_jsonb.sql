-- ────────────────────────────────────────────────────────────
-- posts.content : TEXT → JSONB (Tiptap document)
-- ────────────────────────────────────────────────────────────
-- 이미 content 가 JSONB 면 전체 건너뜀 (재실행 안전)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- content 컬럼이 이미 jsonb 면 아무것도 하지 않음
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'posts'
       AND column_name = 'content'
       AND udt_name = 'jsonb'
  ) THEN
    RAISE NOTICE 'posts.content is already JSONB — skipping 002';
    RETURN;
  END IF;

  -- 1) 임시 JSONB 컬럼 추가
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_json JSONB;

  -- 2) 기존 TEXT 데이터를 빈 Tiptap doc 으로 초기화
  UPDATE posts
     SET content_json = '{"type":"doc","content":[]}'::jsonb
   WHERE content_json IS NULL;

  -- 3) 기존 TEXT content 제거
  ALTER TABLE posts DROP COLUMN IF EXISTS content;

  -- 4) content_json → content 이름 변경
  ALTER TABLE posts RENAME COLUMN content_json TO content;

  -- 5) NOT NULL + 기본값
  ALTER TABLE posts
    ALTER COLUMN content SET DEFAULT '{"type":"doc","content":[]}'::jsonb,
    ALTER COLUMN content SET NOT NULL;

  RAISE NOTICE '002 applied — posts.content converted to JSONB';
END $$;
