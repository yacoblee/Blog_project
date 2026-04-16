import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/authSlice'
import { loginAdmin } from '../../api/auth'
import styles from './LoginModal.module.css'

export default function LoginModal({ onClose }) {
  const dispatch = useDispatch()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const emailRef = useRef(null)

  // 열릴 때 이메일 포커스
  useEffect(() => { emailRef.current?.focus() }, [])

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setError('')
    setLoading(true)
    try {
      const res = await loginAdmin({ email, password })
      // accessToken → Redux 메모리 저장 (localStorage 사용 안 함)
      dispatch(loginSuccess({ accessToken: res.data.accessToken }))
      onClose()
      setTimeout(() => alert('관리자 로그인'), 50)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🔐 관리자 로그인</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <input
              ref={emailRef}
              className={styles.input}
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
