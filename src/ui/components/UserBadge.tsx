import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { CgProfile } from 'react-icons/cg'

export default function UserBadge() {
  const auth = useStore((s) => s.auth)
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/auth')}
      style={styles.badge}
      title="Account"
    >
      <div style={styles.avatar}>
        {auth ? (
          <span style={styles.avatarText}>
            {auth.username.charAt(0).toUpperCase()}
          </span>
        ) : (
          <CgProfile size={18} />
        )}
      </div>
      <div style={styles.info}>
        <span style={styles.name}>
          {auth ? auth.username : 'Not logged in'}
        </span>
        <span style={styles.provider}>
          {auth ? `via ${auth.provider}` : 'Click to login'}
        </span>
      </div>
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px',
    borderRadius: 10,
    background: 'var(--bg-glass)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: 13,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  avatarText: {
    fontWeight: 700,
    fontSize: 14,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 1,
  },
  name: {
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  provider: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
}
