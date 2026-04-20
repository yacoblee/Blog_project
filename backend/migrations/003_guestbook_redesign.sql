-- ────────────────────────────────────────────────────────────
-- 003: 방명록 테이블 재설계
--
-- 변경 사항:
--   1) password_hash  — 일반 사용자가 수정/삭제 시 비밀번호 검증
--   2) parent_id      — 관리자 대댓글(답글) 계층 구조 (self FK)
--   3) is_admin       — 관리자가 작성한 답글 여부 플래그
--   4) updated_at     — 수정 시각
-- ────────────────────────────────────────────────────────────

-- 기존 데이터가 적으므로 DROP 후 재생성 (운영 시에는 ALTER 사용)
DROP TABLE IF EXISTS guestbook;

CREATE TABLE guestbook (
  id            SERIAL       PRIMARY KEY,
  parent_id     INTEGER      REFERENCES guestbook(id) ON DELETE CASCADE,  -- NULL = 최상위 댓글, 값 = 답글
  name          VARCHAR(50)  NOT NULL,
  content       VARCHAR(500) NOT NULL,
  password_hash TEXT,                      -- 일반 사용자: bcrypt hash / 관리자 답글: NULL
  is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- 최상위 댓글 목록 조회 + 페이징 인덱스
CREATE INDEX IF NOT EXISTS idx_guestbook_parent ON guestbook (parent_id, created_at DESC);
