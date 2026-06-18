interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit'
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles[`size_${size}`],
        ...(disabled ? styles.disabled : {}),
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
  },
  primary: {
    background: 'var(--accent-gradient)',
    color: '#fff',
  },
  secondary: {
    background: 'var(--bg-glass-hover)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    color: '#fff',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
  },
  size_sm: { padding: '6px 14px', fontSize: 13 },
  size_md: { padding: '10px 20px', fontSize: 14 },
  size_lg: { padding: '14px 28px', fontSize: 16 },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
