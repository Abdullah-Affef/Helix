import Sidebar from './Sidebar'
import TitleBar from './TitleBar'
import UserBadge from './UserBadge'
import { useStore } from '../../store'

export default function Layout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <div style={styles.container}>
      <div className="app-background" />
      <TitleBar />
      <Sidebar />
      <main style={{
        ...styles.main,
        marginLeft: sidebarCollapsed ? 64 : 240,
        marginTop: 32,
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
  main: {
    flex: 1,
    overflow: 'auto',
    transition: 'margin-left 0.3s ease',
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
