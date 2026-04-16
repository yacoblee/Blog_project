/**
 * fetchWithAuth — 인증이 필요한 API 요청 래퍼
 *
 * 동작 흐름:
 *  1. Redux store 에서 Access Token 꺼내 Authorization 헤더 추가
 *  2. 요청 전송
 *  3. 401 응답 수신 시:
 *     a. /api/auth/refresh 로 새 Access Token 요청 (Refresh Token 쿠키 자동 전송)
 *     b. 성공 → store 업데이트 후 원래 요청 1회 재시도
 *     c. 실패 → store logout dispatch (로그인 화면으로 유도)
 *
 * 동시 다발 401 처리:
 *  refreshPromise 싱글턴으로 refresh 요청이 중복 발생하지 않게 관리
 */
import { store } from '../store'
import { tokenRefreshed, logout } from '../store/authSlice'
import { refreshAccessToken } from './auth'

let refreshPromise = null  // 진행 중인 refresh 요청 (중복 방지)

export async function fetchWithAuth(url, options = {}) {
  const token = store.getState().auth.accessToken

  const mergedOptions = {
    ...options,
    credentials: 'include',   // Refresh Token 쿠키 전송
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }

  let res = await fetch(url, mergedOptions)

  // Access Token 만료 → 자동 재발급 시도
  if (res.status === 401) {
    try {
      // 동시 요청이 여러 개여도 refresh 는 딱 한 번만 실행
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const data = await refreshPromise

      // 새 Access Token 을 store 에 저장 (메모리)
      store.dispatch(tokenRefreshed({ accessToken: data.data.accessToken }))

      // 원래 요청 재시도 (새 토큰으로)
      const retryOptions = {
        ...mergedOptions,
        headers: {
          ...mergedOptions.headers,
          Authorization: `Bearer ${data.data.accessToken}`,
        },
      }
      res = await fetch(url, retryOptions)

    } catch {
      // Refresh Token 도 만료 → 강제 로그아웃
      store.dispatch(logout())
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
    }
  }

  return res
}
