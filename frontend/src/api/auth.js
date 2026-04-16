/**
 * 인증 API 함수 모음
 * credentials: 'include' → 브라우저가 HttpOnly 쿠키를 자동으로 요청에 포함
 */

// 로그인 — Refresh Token 쿠키 수신 + Access Token 반환
export async function loginAdmin({ email, password }) {
  const res = await fetch('/api/auth/login', {
    method:      'POST',
    credentials: 'include',           // 쿠키 수신 허용
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '로그인에 실패했습니다.')
  return data // { data: { accessToken, expiresIn, admin } }
}

// Access Token 무음 재발급 — Refresh Token 쿠키를 자동 전송
export async function refreshAccessToken() {
  const res = await fetch('/api/auth/refresh', {
    method:      'POST',
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '세션이 만료되었습니다.')
  return data // { data: { accessToken, expiresIn } }
}

// 로그아웃 — 서버에서 Refresh Token 쿠키 삭제
export async function logoutAdmin() {
  await fetch('/api/auth/logout', {
    method:      'POST',
    credentials: 'include',
  })
}

// 앱 시작 시 세션 복원 — Refresh Token 쿠키 유효 시 새 Access Token 반환
export async function checkAuthSession() {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) return null  // 미인증 → null
  return data               // { data: { admin, accessToken, expiresIn } }
}
