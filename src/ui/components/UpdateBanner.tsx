import { useStore } from '../../store'
import Button from './Button'

export default function UpdateBanner() {
  const status = useStore((s) => s.updateStatus)

  if (!status) return null

  if (status.type === 'checking') {
    return (
      <div style={styles.banner}>
        Checking for updates...
      </div>
    )
  }

  if (status.type === 'available') {
    return (
      <div style={styles.banner}>
        <span style={styles.text}>
          Update <strong>v{status.version}</strong> available
        </span>
        <Button onClick={() => window.api.update.download()} size="sm">
          Download
        </Button>
      </div>
    )
  }

  if (status.type === 'downloading') {
    return (
      <div style={styles.banner}>
        <span style={styles.text}>
          Downloading update... {status.percent}%
        </span>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${status.percent}%` }} />
        </div>
      </div>
    )
  }

  if (status.type === 'downloaded') {
    return (
      <div style={{ ...styles.banner, background: 'var(--accent-gradient)' }}>
        <span style={styles.text}>
          Update <strong>v{status.version}</strong> ready to install
        </span>
        <Button onClick={() => window.api.update.install()} size="sm">
          Restart & Install
        </Button>
      </div>
    )
  }

  if (status.type === 'error') {
    return (
      <div style={{ ...styles.banner, background: 'var(--danger)' }}>
        <span style={styles.text}>
          Update failed: {status.message}
        </span>
        <Button onClick={() => window.api.update.check()} size="sm">
          Retry
        </Button>
      </div>
    )
  }

  return null
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '8px 16px',
    background: 'var(--bg-glass-hover)',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
    fontWeight: 500,
    animation: 'fadeIn 0.3s ease',
  },
  text: {
    color: 'var(--text-primary)',
  },
  progressBar: {
    width: 120,
    height: 6,
    borderRadius: 3,
    background: 'var(--bg-glass)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent-gradient)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
}
