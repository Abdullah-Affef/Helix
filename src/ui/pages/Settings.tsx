import { useState, useEffect } from 'react'
import GlassPanel from '../components/GlassPanel'
import Button from '../components/Button'
import { themes, applyTheme } from '../styles/themes'
import { FiFolder } from 'react-icons/fi'

export default function Settings() {
  const [javaPath, setJavaPath] = useState('')
  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem('helix-theme') || 'helix-dark',
  )
  const [instancesDir, setInstancesDir] = useState('')

  useEffect(() => {
    window.api.settings.get('instancesDir').then((val) => {
      if (val) setInstancesDir(val)
    })
  }, [])

  function handleThemeChange(themeId: string) {
    setCurrentTheme(themeId)
    applyTheme(themeId)
  }

  async function handleSelectDir() {
    const dir = await window.api.dialog.selectDirectory()
    if (dir) {
      setInstancesDir(dir)
      await window.api.settings.set('instancesDir', dir)
    }
  }

  async function handleResetDir() {
    setInstancesDir('')
    await window.api.settings.set('instancesDir', '')
  }

  return (
    <div>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.section}>
        <GlassPanel>
          <h2 style={styles.sectionTitle}>Appearance</h2>
          <div style={styles.themeGrid}>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                style={{
                  ...styles.themeCard,
                  borderColor: currentTheme === theme.id ? 'var(--accent)' : 'var(--border)',
                  background: currentTheme === theme.id ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
                }}
              >
                <div style={{
                  ...styles.themePreview,
                  background: theme.colors['--bg-primary'],
                }}>
                  <div style={{
                    ...styles.themeAccent,
                    background: theme.colors['--accent'],
                  }} />
                </div>
                <span style={styles.themeName}>{theme.name}</span>
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div style={styles.section}>
        <GlassPanel>
          <h2 style={styles.sectionTitle}>Instances Directory</h2>
          <p style={styles.hint}>
            Each instance will be stored in a subfolder named after the instance.
          </p>
          <div style={styles.dirRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={instancesDir}
              placeholder="Default (app data directory)"
              readOnly
            />
            <Button onClick={handleSelectDir} size="sm">
              <FiFolder size={14} /> Browse
            </Button>
            {instancesDir && (
              <Button onClick={handleResetDir} variant="ghost" size="sm">
                Reset
              </Button>
            )}
          </div>
        </GlassPanel>
      </div>

      <div style={styles.section}>
        <GlassPanel>
          <h2 style={styles.sectionTitle}>Java Settings</h2>
          <div style={styles.field}>
            <label style={styles.label}>Java Path (optional)</label>
            <input
              style={styles.input}
              value={javaPath}
              onChange={(e) => setJavaPath(e.target.value)}
              placeholder="Auto-detect (recommended)"
            />
            <p style={styles.hint}>
              Leave empty to auto-detect Java installation. Requires Java 17+.
            </p>
          </div>
        </GlassPanel>
      </div>

      <div style={styles.section}>
        <GlassPanel>
          <h2 style={styles.sectionTitle}>About</h2>
          <p style={styles.about}>
            Helix Launcher v1.0.0<br />
            A modern Minecraft launcher built with Electron + React.
          </p>
        </GlassPanel>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 28px',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 16px',
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  themeCard: {
    padding: 16,
    borderRadius: 12,
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'inherit',
  },
  themePreview: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'flex-end',
    padding: 8,
  },
  themeAccent: {
    width: '40%',
    height: 4,
    borderRadius: 2,
  },
  themeName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
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
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    maxWidth: 400,
  },
  hint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    margin: '0 0 12px',
  },
  about: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    margin: 0,
  },
  dirRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    maxWidth: 600,
  },
}
