import { useRef, useEffect } from 'react'
import { useStore } from '../../store'

export default function ProgressConsole() {
  const consoleLines = useStore((s) => s.consoleLines)
  const downloadProgress = useStore((s) => s.downloadProgress)
  const clearConsole = useStore((s) => s.clearConsole)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLines])

  if (consoleLines.length === 0 && !downloadProgress) return null

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Console</span>
        <button onClick={clearConsole} style={styles.clearBtn}>
          Clear
        </button>
      </div>

      {downloadProgress && (
        <div style={styles.progressBar}>
          <div style={styles.progressLabel}>{downloadProgress.label}</div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${downloadProgress.percent}%` }} />
          </div>
          <div style={styles.progressPercent}>{downloadProgress.percent}%</div>
        </div>
      )}

      <div style={styles.logs}>
        {consoleLines.map((line, i) => (
          <div key={i} style={styles.line}>
            <span style={styles.time}>
              {new Date(line.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={styles.text}>{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    marginTop: 24,
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-glass)',
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  clearBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'rgba(108, 92, 231, 0.08)',
    borderBottom: '1px solid var(--border)',
  },
  progressLabel: {
    fontSize: 12,
    color: 'var(--accent-light)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0,
    maxWidth: 200,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: 'var(--bg-tertiary)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    background: 'var(--accent-gradient)',
    transition: 'width 0.3s ease',
  },
  progressPercent: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums' as const,
    flexShrink: 0,
    width: 36,
    textAlign: 'right' as const,
  },
  logs: {
    maxHeight: 200,
    overflowY: 'auto',
    padding: '8px 0',
  },
  line: {
    display: 'flex',
    gap: 12,
    padding: '3px 16px',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    lineHeight: '1.5',
  },
  time: {
    color: 'var(--text-muted)',
    flexShrink: 0,
    userSelect: 'none' as const,
  },
  text: {
    color: 'var(--text-secondary)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  },
}
