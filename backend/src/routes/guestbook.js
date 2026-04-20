const express = require('express')
const bcrypt  = require('bcryptjs')
const pool    = require('../config/db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// ════════════════════════════════════════════════════════════
// GET /api/guestbook?page=1&limit=20
// ────────────────────────────────────────────────────────────
// 최상위 댓글(parent_id IS NULL)을 페이징으로 조회한 뒤,
// 각 댓글에 달린 답글(replies)을 JSON 배열로 묶어 반환합니다.
// ════════════════════════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const offset = (page - 1) * limit

    // 1) 최상위 댓글 총 개수
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM guestbook WHERE parent_id IS NULL'
    )
    const total = Number(countRows[0].count)

    // 2) 최상위 댓글 (페이징)
    const { rows: parents } = await pool.query(
      `SELECT id, name, content, is_admin, created_at, updated_at
         FROM guestbook
        WHERE parent_id IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    // 3) 해당 댓글들의 답글 한 번에 가져오기
    const parentIds = parents.map(p => p.id)
    let repliesMap = {}

    if (parentIds.length > 0) {
      const { rows: replies } = await pool.query(
        `SELECT id, parent_id, name, content, is_admin, created_at, updated_at
           FROM guestbook
          WHERE parent_id = ANY($1)
          ORDER BY created_at ASC`,
        [parentIds]
      )
      for (const r of replies) {
        if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = []
        repliesMap[r.parent_id].push(r)
      }
    }

    // 4) 합치기
    const data = parents.map(p => ({
      ...p,
      replies: repliesMap[p.id] || [],
    }))

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// POST /api/guestbook
// ────────────────────────────────────────────────────────────
// 일반 사용자: { name, content, password }
//   → password_hash 저장, is_admin = false
// ════════════════════════════════════════════════════════════
router.post('/', async (req, res, next) => {
  try {
    const { name, content, password } = req.body

    if (!name || !content) {
      return res.status(400).json({ error: '이름과 내용은 필수입니다.' })
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: '비밀번호는 4자 이상 입력해주세요.' })
    }
    if (content.length > 500) {
      return res.status(400).json({ error: '내용은 500자 이내로 작성해주세요.' })
    }

    const hash = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
      `INSERT INTO guestbook (name, content, password_hash, is_admin)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, name, content, is_admin, created_at, updated_at`,
      [name.trim(), content.trim(), hash]
    )

    res.status(201).json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// POST /api/guestbook/:parentId/reply   (관리자 전용)
// ────────────────────────────────────────────────────────────
// 관리자만 답글 작성 가능. parent_id 설정, is_admin = true
// ════════════════════════════════════════════════════════════
router.post('/:parentId/reply', requireAuth, async (req, res, next) => {
  try {
    const parentId = Number(req.params.parentId)
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: '답글 내용을 입력해주세요.' })
    }

    // 부모 댓글 존재 확인
    const { rows: parent } = await pool.query(
      'SELECT id FROM guestbook WHERE id = $1 AND parent_id IS NULL',
      [parentId]
    )
    if (!parent[0]) {
      return res.status(404).json({ error: '원본 댓글을 찾을 수 없습니다.' })
    }

    const adminName = req.user.email?.split('@')[0] || '관리자'

    const { rows } = await pool.query(
      `INSERT INTO guestbook (parent_id, name, content, is_admin)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, parent_id, name, content, is_admin, created_at, updated_at`,
      [parentId, adminName, content.trim()]
    )

    res.status(201).json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// PUT /api/guestbook/:id
// ────────────────────────────────────────────────────────────
// 일반 사용자 본인 댓글 수정 — 비밀번호 검증 필수
// ════════════════════════════════════════════════════════════
router.put('/:id', async (req, res, next) => {
  try {
    const { content, password } = req.body

    if (!content) return res.status(400).json({ error: '내용을 입력해주세요.' })
    if (!password) return res.status(400).json({ error: '비밀번호를 입력해주세요.' })
    if (content.length > 500) return res.status(400).json({ error: '내용은 500자 이내입니다.' })

    const { rows } = await pool.query(
      'SELECT id, password_hash, is_admin FROM guestbook WHERE id = $1',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' })
    if (rows[0].is_admin) return res.status(403).json({ error: '관리자 답글은 수정할 수 없습니다.' })

    const match = await bcrypt.compare(password, rows[0].password_hash)
    if (!match) return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' })

    const { rows: updated } = await pool.query(
      `UPDATE guestbook
         SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, content, is_admin, created_at, updated_at`,
      [content.trim(), req.params.id]
    )

    res.json({ data: updated[0] })
  } catch (err) {
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// DELETE /api/guestbook/:id
// ────────────────────────────────────────────────────────────
// 방법 1) 일반 사용자: body { password } 로 비밀번호 검증 후 삭제
// 방법 2) 관리자: Authorization 헤더 → 비밀번호 없이 즉시 삭제
// ════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const entryId = req.params.id

    const { rows } = await pool.query(
      'SELECT id, password_hash, is_admin FROM guestbook WHERE id = $1',
      [entryId]
    )
    if (!rows[0]) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' })

    const entry = rows[0]

    // ── 관리자 토큰 체크 (있으면 비밀번호 없이 삭제) ──
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt   = require('jsonwebtoken')
      try {
        jwt.verify(authHeader.slice(7), process.env.JWT_SECRET)
        // 관리자 인증 성공 → 즉시 삭제 (자식 답글도 CASCADE)
        await pool.query('DELETE FROM guestbook WHERE id = $1', [entryId])
        return res.status(204).end()
      } catch {
        // 토큰 검증 실패 → 일반 사용자 비밀번호 흐름으로 fallthrough
      }
    }

    // ── 일반 사용자: 비밀번호 검증 ──
    const { password } = req.body || {}
    if (!password) return res.status(400).json({ error: '비밀번호를 입력해주세요.' })
    if (!entry.password_hash) return res.status(403).json({ error: '이 댓글은 비밀번호로 삭제할 수 없습니다.' })

    const match = await bcrypt.compare(password, entry.password_hash)
    if (!match) return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' })

    await pool.query('DELETE FROM guestbook WHERE id = $1', [entryId])
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
