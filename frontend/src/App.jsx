import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, authChecked } from './store/authSlice'
import { checkAuthSession } from './api/auth'
import AppLayout from './components/layout/AppLayout'
import MainPage from './pages/MainPage'
import BlogPage from './pages/BlogPage'
import PostDetailPage from './pages/PostDetailPage'
import PostFormPage from './pages/PostFormPage'
import ResumePage from './pages/ResumePage'
import GuestbookPage from './pages/GuestbookPage'
import AdminPage from './pages/AdminPage'

/**
 * AuthInit — 앱 최초 마운트 시 세션 복원
 *
 * 새로고침해도 Refresh Token(HttpOnly 쿠키)이 살아있으면
 * /api/auth/me 에서 새 Access Token 을 발급받아 로그인 상태 복원.
 * localStorage 를 전혀 읽지 않음.
 */
function AuthInit() {
  const dispatch      = useDispatch()
  const initialized   = useSelector(state => state.auth.initialized)

  useEffect(() => {
    if (initialized) return
    checkAuthSession()
      .then(data => {
        if (data?.data?.accessToken) {
          dispatch(loginSuccess({ accessToken: data.data.accessToken }))
        } else {
          dispatch(authChecked())
        }
      })
      .catch(() => dispatch(authChecked()))
  }, [dispatch, initialized])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInit />
      <AppLayout>
        <Routes>
          <Route path="/"              element={<MainPage />} />
          <Route path="/blog"          element={<BlogPage />} />
          <Route path="/blog/new"      element={<PostFormPage />} />
          <Route path="/blog/:id"      element={<PostDetailPage />} />
          <Route path="/blog/:id/edit" element={<PostFormPage />} />
          <Route path="/resume"        element={<ResumePage />} />
          <Route path="/guestbook"     element={<GuestbookPage />} />
          <Route path="/admin"         element={<AdminPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
