import { useState } from 'react'
import Button from '../components/Button'
import { FiFolder, FiArrowRight } from 'react-icons/fi'

interface SetupProps {
  onComplete: () => void
}

export default function Setup({ onComplete }: SetupProps) {
  const [launcherDir, setLauncherDir] = useState('')
  const [instancesDir, setInstancesDir] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSelectLauncherDir() {
    const dir = await window.api.dialog.selectDirectory()
    if (dir) setLauncherDir(dir)
  }

  async function handleSelectInstancesDir() {
    const dir = await window.api.dialog.selectDirectory()
    if (dir) setInstancesDir(dir)
  }

  async function handleComplete() {
    setSaving(true)
    try {
      if (launcherDir) {
        await window.api.settings.set('launcherDir', launcherDir)
      }
      if (instancesDir) {
        await window.api.settings.set('instancesDir', instancesDir)
      }
      await window.api.setup.complete()
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.background} />
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconContainer}>
            <span style={styles.logoIcon}>☀</span>
          </div>
          <h1 style={styles.title}>Welcome to Helix</h1>
          <p style={styles.subtitle}>
            Choose where your game data and instances will be stored.
            You can change these later in Settings.
          </p>

          <div style={styles.section}>
            <label style={styles.label}>Game Content Directory</label>
            <p style={styles.hint}>
              Stores Minecraft versions, assets, libraries, and Java runtime.
            </p>
            <div style={styles.dirRow}>
              <input
                style={styles.input}
                value={launcherDir}
                placeholder="Default (app data directory)"
                readOnly
              />
              <Button onClick={handleSelectLauncherDir} size="sm">
                <FiFolder size={14} /> Browse
              </Button>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Instances Directory</label>
            <p style={styles.hint}>
              Each Minecraft instance (mods, saves, config) gets its own folder here.
            </p>
            <div style={styles.dirRow}>
              <input
                style={styles.input}
                value={instancesDir}
                placeholder="Default (inside game content directory)"
                readOnly
              />
              <Button onClick={handleSelectInstancesDir} size="sm">
                <FiFolder size={14} /> Browse
              </Button>
            </div>
          </div>

          <div style={styles.actions}>
            <Button onClick={handleComplete} size="lg" disabled={saving}>
              {saving ? 'Setting up...' : 'Get Started'} <FiArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    inset: 0,
    background: 'var(--bg-primary)',
  },
  container: {
    position: 'relative',
    maxWidth: 520,
    width: '100%',
    padding: 24,
  },
  card: {
    background: 'var(--bg-glass-strong)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 40,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    margin: '0 0 8px',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    margin: '0 0 32px',
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    margin: '0 0 8px',
  },
  dirRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 8,
  },
}
