const express  = require('express')
const pool     = require('../config/db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

/* ────────────────────────────────────────────────────────────
 * Tiptap content 정규화 헬퍼
 *  - 입력 형태:
 *      ① { type: 'doc', content: [...] }   (object)
 *      ② '{"type":"doc","content":[...]}'  (JSON string)
 *  - 결과: 항상 object — 내부에서 JSON.stringify 후 jsonb 컬럼에 저장
 *  - 검증: 최소 조건으로 type === 'doc' 만 확인
 *          (그 외 스키마 검증은 Tiptap 서버 사이드 schema가 별도로 필요할 때 추가)
 * ──────────────────────────────────────────────────────────── */
function normalizeContent(raw) {
  if (raw == null) return null
  let obj = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) }
    catch { return null }
  }
  if (!obj || typeof obj !== 'object' || obj.type !== 'doc') return null
  return obj
}

/* node-postgres는 객체를 jsonb 파라미터로 그대로 보내면 string이 되어버리므로
   명시적으로 JSON.stringify 한 뒤 ::jsonb 캐스팅을 사용한다. */

// ── 목록 ──────────────────────────────────────────────────
// GET /api/posts?category=&page=&limit=&search=
router.get('/', async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const conditions = []
    const params     = []

    if (category) {
      params.push(category)
      conditions.push(`category = $${params.length}`)
    }

    if (search) {
      // JSONB content 안의 텍스트 검색 — content::text ILIKE
      params.push(`%${search}%`)
      conditions.push(`(title ILIKE $${params.length} OR content::text ILIKE $${params.length})`)
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''

    const dataQuery = `SELECT * FROM posts${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), offset)

    const { rows } = await pool.query(dataQuery, params)

    // 전체 개수 (LIMIT/OFFSET 없이)
    const countParams = params.slice(0, params.length - 2)
    const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM posts${where}`, countParams)
    const total = Number(countRows[0].count)

    // pg 드라이버는 jsonb를 자동으로 JS object로 디시리얼라이즈해서 돌려준다.
    // 프론트엔드는 그대로 Tiptap에 주입 가능.
    res.json({
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── 단건 조회 ─────────────────────────────────────────────
// GET /api/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [req.params.id]
    )
    if (!rows[0]) {
      return res.status(404).json({ error: '포스트를 찾을 수 없습니다.' })
    }
    // rows[0].content 는 jsonb → 자동으로 object 로 반환됨
    res.json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ── 생성 (admin) ───────────────────────────────────────────
// POST /api/posts   body: { title, content (JSON string|object), ... }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, content, category, thumbnail, author, read_time } = req.body
    if (!title || content == null) {
      return res.status(400).json({ error: 'title과 content는 필수입니다.' })
    }

    const doc = normalizeContent(content)
    if (!doc) {
      return res.status(400).json({ error: 'content는 Tiptap 문서(JSON) 형태여야 합니다.' })
    }

    const { rows } = await pool.query(
      `INSERT INTO posts (title, content, category, thumbnail, author, read_time)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)
       RETURNING *`,
      [title, JSON.stringify(doc), category || null, thumbnail || null, author || null, read_time || null]
    )
    res.status(201).json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ── 수정 (admin) ───────────────────────────────────────────
// PUT /api/posts/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { title, content, category, thumbnail, author, read_time } = req.body

    // content가 들어왔을 때만 검증 (부분 업데이트 허용)
    let docStr = null
    if (content !== undefined) {
      const doc = normalizeContent(content)
      if (!doc) {
        return res.status(400).json({ error: 'content는 Tiptap 문서(JSON) 형태여야 합니다.' })
      }
      docStr = JSON.stringify(doc)
    }

    const { rows } = await pool.query(
      `UPDATE posts
         SET title     = COALESCE($1, title),
             content   = COALESCE($2::jsonb, content),
             category  = COALESCE($3, category),
             thumbnail = COALESCE($4, thumbnail),
             author    = COALESCE($5, author),
             read_time = COALESCE($6, read_time),
             updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title ?? null, docStr, category ?? null, thumbnail ?? null, author ?? null, read_time ?? null, req.params.id]
    )
    if (!rows[0]) {
      return res.status(404).json({ error: '포스트를 찾을 수 없습니다.' })
    }
    res.json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ── 삭제 (admin) ───────────────────────────────────────────
// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM posts WHERE id = $1',
      [req.params.id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: '포스트를 찾을 수 없습니다.' })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
