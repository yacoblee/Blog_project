import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar } from '../../store/uiSlice'

import LoginModal from '../common/LoginModal'
import styles from './Header.module.css'

export default function Header() {
  const dispatch    = useDispatch()
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen)



  return (
    <>
      <header className={styles.header}>
        {/* 모바일: 로고 */}
        <span className={styles.logo}>{'</ sh_lee >'}</span>

        <div className={styles.right}>
          {/* 관리자 로그인 / 로그아웃 버튼 */}


          {/* 모바일 햄버거 */}
          <button
            className={styles.burger}
            onClick={() => dispatch(toggleSidebar())}
            aria-label={sidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            <span className={`${styles.bar} ${sidebarOpen ? styles.open : ''}`} />
            <span className={`${styles.bar} ${sidebarOpen ? styles.open : ''}`} />
            <span className={`${styles.bar} ${sidebarOpen ? styles.open : ''}`} />
          </button>
        </div>
      </header>

     
    </>
  )
}
