import { useState, useRef, useEffect } from 'react'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
}

export default function Select({ value, onChange, options }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={styles.wrapper}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={styles.trigger}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
          <path fill="#888" d="M6 8L1 3h10z" />
        </svg>
      </button>

      {open && (
        <div style={styles.menu}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                ...styles.item,
                ...(opt === value ? styles.selected : {}),
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    marginTop: 4,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    maxHeight: 240,
    overflowY: 'auto' as const,
  },
  item: {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
  },
  selected: {
    background: 'color-mix(in srgb, var(--accent) 25%, transparent)',
    color: 'var(--accent-light)',
  },
}
