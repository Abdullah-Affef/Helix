import { useState } from 'react'
import { useStore } from '../../store'
import GlassPanel from '../components/GlassPanel'
import Button from '../components/Button'
import { FiUser, FiMail, FiLock, FiLogOut, FiEye, FiEyeOff } from 'react-icons/fi'

export default function Auth() {
  const auth = useStore((s) => s.auth)
  const setAuth = useStore((s) => s.setAuth)

  const [mode, setMode] = useState<'offline' | 'elyby'>('offline')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'offline') {
        const session = await window.api.auth.login('offline', { username })
        setAuth(session)
      } else {
        const session = await window.api.auth.login('elyby', {
          username: email,
          password,
        })
        setAuth(session)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await window.api.auth.logout()
    setAuth(null)
  }

  if (auth) {
    return (
      <div style={styles.container}>
        <GlassPanel style={styles.panel}>
          <div style={styles.loggedIn}>
            <div style={styles.avatar}>
              {auth.username.charAt(0).toUpperCase()}
            </div>
            <h2 style={styles.welcome}>Logged in as</h2>
            <p style={styles.usernameDisplay}>{auth.username}</p>
            <span style={styles.provider}>
              via {auth.provider === 'elyby' ? 'Ely.by' : 'Offline'}
            </span>
            <Button onClick={handleLogout} variant="danger" style={{ marginTop: 20 }}>
              <FiLogOut size={16} /> Logout
            </Button>
          </div>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <GlassPanel style={styles.panel}>
        <h1 style={styles.title}>Account</h1>
        <p style={styles.subtitle}>
          Login to play online or use offline mode for local play.
        </p>

        <div style={styles.tabs}>
          <button
            onClick={() => setMode('offline')}
            style={{
              ...styles.tab,
              background: mode === 'offline' ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'transparent',
              borderColor: mode === 'offline' ? 'var(--accent)' : 'transparent',
            }}
          >
            Offline
          </button>
          <button
            onClick={() => setMode('elyby')}
            style={{
              ...styles.tab,
              background: mode === 'elyby' ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'transparent',
              borderColor: mode === 'elyby' ? 'var(--accent)' : 'transparent',
            }}
          >
            Ely.by
          </button>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {mode === 'offline' ? (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputWrap}>
                <FiUser size={16} style={styles.inputIcon} />
                <input
                  style={styles.input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Steve"
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrap}>
                  <FiMail size={16} style={styles.inputIcon} />
                  <input
                    style={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@ely.by"
                    required
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <FiLock size={16} style={styles.inputIcon} />
                  <input
                    style={styles.inputPwd}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </GlassPanel>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 40,
    animation: 'fadeIn 0.4s ease',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: '0 0 24px',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid transparent',
    color: 'var(--text-primary)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  inputPwd: {
    width: '100%',
    padding: '10px 36px 10px 36px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  error: {
    padding: '10px 14px',
    background: 'rgba(255, 82, 82, 0.1)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    borderRadius: 8,
    color: 'var(--danger)',
    fontSize: 13,
  },
  loggedIn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  usernameDisplay: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  provider: {
    fontSize: 13,
    color: 'var(--accent-light)',
  },
}
