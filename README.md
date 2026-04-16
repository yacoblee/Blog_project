# Blog Project

개인 포트폴리오 블로그 — React + Express + PostgreSQL + Tiptap

## 구조

```
MainProject/
├── frontend/   # React 19 + Vite + Redux Toolkit + React Query + Tiptap
└── backend/    # Express + PostgreSQL (pg) + JWT
```

## 핵심 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19, Vite 8, React Router v7, Redux Toolkit, TanStack Query, Tiptap |
| Backend | Express, PostgreSQL (JSONB), JWT (Access + HttpOnly Refresh) |
| Editor | Tiptap (작성·조회 모두 동일 스키마) |

## 실행

### Backend
```bash
cd backend
cp .env.example .env   # DB / JWT 시크릿 채우기
npm install
npm run migrate        # 스키마 + 초기 admin 생성
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 데이터 흐름 (Tiptap + JSON)

```
TiptapEditor.getJSON()
        ↓ fetch POST /api/posts (JSON body)
Express + pg
        ↓ INSERT INTO posts(content JSONB)
PostgreSQL
        ↓ SELECT (pg가 자동으로 JS 객체로 parse)
<TiptapViewer content={post.content} editable={false} />
```
