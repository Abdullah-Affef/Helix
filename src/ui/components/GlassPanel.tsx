interface GlassPanelProps {
  children: React.ReactNode
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
}

export default function GlassPanel({ children, style, hover, onClick }: GlassPanelProps) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.panel,
        ...(hover ? styles.hoverable : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: 24,
    transition: 'all 0.3s ease',
  },
  hoverable: {
    cursor: 'pointer',
  },
}
