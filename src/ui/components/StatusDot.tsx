interface StatusDotProps {
  status: 'online' | 'offline' | 'loading' | 'error'
  size?: number
}

export default function StatusDot({ status, size = 10 }: StatusDotProps) {
  const colors = {
    online: '#00e676',
    offline: '#666',
    loading: '#ffd740',
    error: '#ff5252',
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[status],
        display: 'inline-block',
        boxShadow: `0 0 6px ${colors[status]}44`,
        animation: status === 'loading' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}
    />
  )
}
