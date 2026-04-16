import { createSlice } from '@reduxjs/toolkit'

/**
 * 인증 상태 — 메모리 전용 (localStorage 저장 금지)
 *
 * accessToken : 15분 유효 Access Token → 메모리에만 존재
 *               XSS로 탈취 불가 (DOM/storage 미노출)
 *
 * isAdmin     : 관리자 여부 — UI 렌더링 제어용
 *
 * initialized : App 시작 시 /api/auth/me 호출 완료 여부
 *               false 동안 인증이 필요한 UI를 렌더링하지 않음
 *
 * Refresh Token은 백엔드가 HttpOnly 쿠키로 관리.
 * 프론트엔드 코드에서 직접 접근 불가 → XSS·CSRF 모두 방어.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAdmin:     false,
    accessToken: null,   // 메모리에만 저장
    initialized: false,  // /me 체크 완료 전까지 false
  },
  reducers: {
    loginSuccess(state, action) {
      state.isAdmin     = true
      state.accessToken = action.payload.accessToken
      state.initialized = true
    },
    // Access Token 만료 후 refresh 성공 시 토큰만 교체
    tokenRefreshed(state, action) {
      state.accessToken = action.payload.accessToken
    },
    logout(state) {
      state.isAdmin     = false
      state.accessToken = null
      state.initialized = true
    },
    // 앱 시작 시 /me 결과가 미인증(401)임을 확인
    authChecked(state) {
      state.initialized = true
    },
  },
})

export const { loginSuccess, tokenRefreshed, logout, authChecked } = authSlice.actions
export default authSlice.reducer
