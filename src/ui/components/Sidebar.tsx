import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../store'
import { FiHome, FiBox, FiSettings, FiCompass } from 'react-icons/fi'
import { CgProfile } from 'react-icons/cg'

const navItems = [
  { path: '/', icon: FiHome, label: 'Home' },
  { path: '/browse', icon: FiCompass, label: 'Browse' },
  { path: '/instances', icon: FiBox, label: 'Instances' },
]

const bottomItems = [
  { path: '/auth', icon: CgProfile, label: 'Accounts' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const auth = useStore((s) => s.auth)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{
      ...styles.sidebar,
      width: sidebarCollapsed ? 64 : 240,
    }}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>☀</span>
        {!sidebarCollapsed && <span style={styles.logoText}>Helix</span>}
      </div>

      <div style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                background: active ? 'var(--bg-glass-hover)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={styles.navLabel}>{item.label}</span>}
            </button>
          )
        })}
      </div>

      <div style={styles.bottomSection}>
        {bottomItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          const isAccounts = item.path === '/auth'
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                background: active ? 'var(--bg-glass-hover)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                ...(isAccounts && auth ? styles.loggedInItem : {}),
              }}
            >
              <div style={styles.iconWrap}>
                {isAccounts && auth ? (
                  <div style={styles.miniAvatar}>
                    {auth.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Icon size={20} />
                )}
              </div>
              {!sidebarCollapsed && (
                <div style={styles.bottomLabel}>
                  <span>{item.label}</span>
                  {isAccounts && auth && (
                    <span style={styles.accountName}>{auth.username}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
        <button onClick={toggleSidebar} style={styles.collapseBtn}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'var(--sidebar-bg)',
    backdropFilter: 'var(--sidebar-blur)',
    WebkitBackdropFilter: 'var(--sidebar-blur)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease, background 0.3s ease',
    zIndex: 100,
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px 20px 24px',
    borderBottom: '1px solid var(--border)',
    marginTop: 32,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: 8,
    fontSize: 14,
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
    width: '100%',
    fontFamily: 'inherit',
  },
  navLabel: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bottomSection: {
    padding: '8px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  bottomLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    overflow: 'hidden',
  },
  accountName: {
    fontSize: 11,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  iconWrap: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
  },
  loggedInItem: {
    color: 'var(--accent-light)',
  },
  collapseBtn: {
    padding: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'center' as const,
    borderRadius: 6,
    fontFamily: 'inherit',
  },
}
