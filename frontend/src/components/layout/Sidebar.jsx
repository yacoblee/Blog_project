import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { setSidebarOpen } from '../../store/uiSlice'
import { logout } from '../../store/authSlice'
import { logoutAdmin } from '../../api/auth'
import { useCategories } from '../../api/categories'
import LoginModal from '../common/LoginModal'
import styles from './Sidebar.module.css'

const STATIC_NAV = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/resume', label: '이력서', icon: '📄' },
  { to: '/guestbook', label: '방명록', icon: '💬' },
]

export default function Sidebar() {
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const location    = useLocation()
  const [searchParams] = useSearchParams()

  const isAdmin     = useSelector(state => state.auth.isAdmin)
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen)

  const [blogOpen,   setBlogOpen]   = useState(true)
  const [showLogin,  setShowLogin]  = useState(false)

  const { data: catData } = useCategories()
  const categories = catData?.data || []

  const close = () => dispatch(setSidebarOpen(false))
  const currentCategory = searchParams.get('category')

  const handleBlogAll = () => { navigate('/blog'); close() }
  const handleCategory = (slug) => { navigate(`/blog?category=${slug}`); close() }

  const handleLogout = async () => {
    try { await logoutAdmin() }
    finally { dispatch(logout()) }
  }

  return (
    <>
      {/* ── 사이드바 본체 ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>

        {/* 브랜드 */}
        <div className={styles.brand}>
          <span className={styles.logo}>{'< Dev />'}</span>
          <p className={styles.tagline}>Personal Tech Archive</p>
        </div>

        {/* 내비게이션 (flex: 1 → 남은 공간 차지) */}
        <nav className={styles.nav}>
          <p className={styles.navLabel}>메뉴</p>
          <ul>
            {STATIC_NAV.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={close}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}

            {/* 개인 공부 드롭다운 */}
            <li>
              <button
                className={`${styles.navLink} ${styles.dropdownToggle} ${
                  location.pathname.startsWith('/blog') ? styles.active : ''
                }`}
                onClick={() => setBlogOpen(prev => !prev)}
              >
                <span className={styles.navIcon}>📝</span>
                <span className={styles.dropdownLabel}>개인 공부</span>
                <span className={`${styles.chevron} ${blogOpen ? styles.chevronOpen : ''}`}>
                  ›
                </span>
              </button>

              {blogOpen && (
                <ul className={styles.subMenu}>
                  <li>
                    <button
                      className={`${styles.subLink} ${
                        location.pathname === '/blog' && !currentCategory ? styles.subActive : ''
                      }`}
                      onClick={handleBlogAll}
                    >
                      전체
                    </button>
                  </li>
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <button
                        className={`${styles.subLink} ${
                          currentCategory === cat.slug ? styles.subActive : ''
                        }`}
                        onClick={() => handleCategory(cat.slug)}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* 관리자 메뉴 (로그인 시에만) */}
            {isAdmin && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={close}
                >
                  <span className={styles.navIcon}>⚙️</span>
                  관리자
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* ── 로그인 / 로그아웃 버튼 (footer 50px 위) ── */}
        <div className={styles.bottom}>
          {isAdmin ? (
            <button
              className={`${styles.authBtn} ${styles.logoutBtn}`}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          ) : (
            <button
              className={styles.authBtn}
              onClick={() => setShowLogin(true)}
            >
              관리자 로그인
            </button>
          )}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <p>© {new Date().getFullYear()} SH Archive</p>
        </div>
      </aside>

      {/* ── 로그인 모달 (position:fixed 오버레이 — 사이드바 밖에서 렌더링) ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
