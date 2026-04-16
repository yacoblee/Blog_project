-- ── 확장 ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 테이블 ───────────────────────────────────────────────

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts
-- content : Tiptap 에디터의 JSON 문서( { type: 'doc', content: [...] } )
CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  content    JSONB        NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  category   VARCHAR(100),
  thumbnail  TEXT,
  author     VARCHAR(100),
  read_time  INTEGER,                 -- 분 단위
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- guestbook
CREATE TABLE IF NOT EXISTS guestbook (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  content    VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 기본 카테고리 ─────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Frontend', 'frontend'),
  ('Backend',  'backend'),
  ('DevOps',   'devops'),
  ('일상',     'daily')
ON CONFLICT DO NOTHING;
