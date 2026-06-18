import Sidebar from './Sidebar'
import TitleBar from './TitleBar'
import UserBadge from './UserBadge'
import UpdateBanner from './UpdateBanner'
import { useStore } from '../../store'

export default function Layout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const updateStatus = useStore((s) => s.updateStatus)

  return (
    <div style={styles.container}>
      <div className="app-background" />
      <TitleBar />
      <Sidebar />
      <div style={{
        ...styles.mainWrap,
        marginLeft: sidebarCollapsed ? 64 : 240,
        marginTop: 32,
      }}>
        <UpdateBanner />
        <main style={{
          ...styles.main,
          height: updateStatus ? 'calc(100vh - 32px - 41px)' : 'calc(100vh - 32px)',
        }}>
          <div style={styles.topBar}>
            <div />
            <UserBadge />
          </div>
          <div style={styles.content}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden',
    position: 'relative',
  },
  mainWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 0.3s ease',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '0 40px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0 16px',
    minHeight: 48,
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    flex: 1,
  },
}
