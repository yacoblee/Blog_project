const express  = require('express')
const pool     = require('../config/db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/guestbook
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM guestbook ORDER BY created_at DESC'
    )
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

// POST /api/guestbook
router.post('/', async (req, res, next) => {
  try {
    const { name, content } = req.body
    if (!name || !content) {
      return res.status(400).json({ error: '이름과 내용은 필수입니다.' })
    }
    if (content.length > 500) {
      return res.status(400).json({ error: '내용은 500자 이내로 작성해주세요.' })
    }

    const { rows } = await pool.query(
      'INSERT INTO guestbook (name, content) VALUES ($1, $2) RETURNING *',
      [name.trim(), content.trim()]
    )
    res.status(201).json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/guestbook/:id  (admin)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM guestbook WHERE id = $1',
      [req.params.id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: '항목을 찾을 수 없습니다.' })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
