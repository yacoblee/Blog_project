import { useDispatch, useSelector } from 'react-redux'
import { setSidebarOpen } from '../../store/uiSlice'
import Sidebar from './Sidebar'
import Header from './Header'
import styles from './AppLayout.module.css'

export default function AppLayout({ children }) {
  const dispatch    = useDispatch()
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen)



    
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}
