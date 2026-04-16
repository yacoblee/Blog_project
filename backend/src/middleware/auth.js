const jwt = require('jsonwebtoken')

/**
 * Access Token 검증 미들웨어
 *
 * 흐름:
 *   프론트엔드 메모리(Redux)에 저장된 Access Token(15분 유효)을
 *   Authorization: Bearer <token> 헤더로 전달 → 여기서 검증
 *
 * Access Token 만료(401) 시:
 *   프론트엔드 fetchWithAuth 가 /api/auth/refresh 를 자동 호출해
 *   HttpOnly 쿠키의 Refresh Token으로 새 Access Token 을 받아 재시도
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' })
  }

  const token = authHeader.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    // 만료된 토큰은 명시적으로 구분 → 프론트에서 refresh 시도 가능
    const isExpired = err.name === 'TokenExpiredError'
    return res.status(401).json({
      error:   isExpired ? '토큰이 만료되었습니다.' : '유효하지 않은 토큰입니다.',
      expired: isExpired,
    })
  }
}

module.exports = { requireAuth }
