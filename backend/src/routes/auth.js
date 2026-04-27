const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router = express.Router()

// ── 쿠키 옵션 헬퍼 ────────────────────────────────────────────
// COOKIE_SECURE 환경변수로 NODE_ENV와 독립적으로 제어
// HTTP 서비스: COOKIE_SECURE=false
// HTTPS 서비스: COOKIE_SECURE=true
const isCookieSecure = process.env.COOKIE_SECURE === 'true'

/**
 * Refresh Token 쿠키 옵션
 * - httpOnly  : JS 접근 완전 차단 → XSS 방어
 * - secure    : HTTPS 전용 (COOKIE_SECURE=true 일 때만 활성화)
 * - sameSite  : secure=true → 'strict' / HTTP → 'lax'
 * - path      : /api/auth 로 한정 → 다른 경로에 쿠키 불필요 전송 방지
 *
 * MSA 주의: 서브도메인이 다를 경우 domain: '.yourdomain.com' 추가 필요
 */
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure:   isCookieSecure,
  sameSite: isCookieSecure ? 'strict' : 'lax',
  path:     '/api/auth',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7일 (ms)
}

// ── 토큰 생성 헬퍼 ────────────────────────────────────────────
function createAccessToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // Access Token: 15분 (짧게 유지)
  )
}

function createRefreshToken(admin) {
  return jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }   // Refresh Token: 7일
  )
}

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' })
    }

    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE email = $1', [email]
    )
    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' })
    }

    const match = await bcrypt.compare(password, admin.password_hash)
    if (!match) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' })
    }

    const accessToken  = createAccessToken(admin)
    const refreshToken = createRefreshToken(admin)

    // Refresh Token → HttpOnly 쿠키 (JS 접근 불가)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS)

    // Access Token → 응답 바디 (프론트엔드 메모리에만 저장)
    res.json({
      data: {
        accessToken,          // 프론트엔드 메모리(Redux)에 저장 — localStorage 금지
        expiresIn: 15 * 60,   // 초 단위 (15분)
        admin: { id: admin.id, email: admin.email },
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/auth/refresh ────────────────────────────────────
// Access Token 만료 시 Refresh Token 쿠키로 재발급
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return res.status(401).json({ error: '갱신 토큰이 없습니다. 다시 로그인하세요.' })
    }

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    let payload
    try {
      payload = jwt.verify(token, secret)
    } catch {
      res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS)
      return res.status(401).json({ error: '갱신 토큰이 만료되었습니다. 다시 로그인하세요.' })
    }

    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE id = $1', [payload.id]
    )
    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ error: '관리자를 찾을 수 없습니다.' })
    }

    const newAccessToken  = createAccessToken(admin)
    const newRefreshToken = createRefreshToken(admin)

    // Refresh Token 교체 (Refresh Token Rotation)
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS)

    res.json({
      data: {
        accessToken: newAccessToken,
        expiresIn:   15 * 60,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────
// 페이지 새로고침 시 프론트엔드가 인증 상태 복원에 사용
router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) return res.status(401).json({ error: '인증되지 않았습니다.' })

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    let payload
    try {
      payload = jwt.verify(token, secret)
    } catch {
      return res.status(401).json({ error: '세션이 만료되었습니다.' })
    }

    const { rows } = await pool.query(
      'SELECT id, email FROM admins WHERE id = $1', [payload.id]
    )
    if (!rows[0]) return res.status(401).json({ error: '관리자를 찾을 수 없습니다.' })

    // 새 Access Token도 함께 발급
    const accessToken = createAccessToken(rows[0])
    res.json({ data: { admin: rows[0], accessToken, expiresIn: 15 * 60 } })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS)
  res.json({ data: { message: '로그아웃되었습니다.' } })
})

module.exports = router
