interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-glass-hover)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}
