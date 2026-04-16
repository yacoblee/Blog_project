const express  = require('express')
const pool     = require('../config/db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    )
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

// POST /api/categories  (admin)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, slug } = req.body
    if (!name || !slug) {
      return res.status(400).json({ error: 'name과 slug는 필수입니다.' })
    }
    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    )
    res.status(201).json({ data: rows[0] })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/categories/:id  (admin)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
