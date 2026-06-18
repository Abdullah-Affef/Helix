import { useNavigate } from 'react-router-dom'
import GlassPanel from './GlassPanel'

interface Instance {
  id: string
  name: string
  version: string
  loader: 'vanilla' | 'fabric'
  createdAt: number
  icon: string
  minMemory: number
  maxMemory: number
  lastPlayed: number | null
}

export default function InstanceCard({ instance }: { instance: Instance }) {
  const navigate = useNavigate()

  return (
    <GlassPanel
      hover
      onClick={() => navigate(`/instances/${instance.id}`)}
      style={styles.card}
    >
      <div style={styles.header}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>
            {instance.icon === 'default' ? '📦' : instance.icon}
          </span>
        </div>
        <div style={styles.info}>
          <h3 style={styles.name}>{instance.name}</h3>
          <span style={styles.version}>
            {instance.version}
            {instance.loader === 'fabric' && ' (Fabric)'}
          </span>
        </div>
      </div>
      <div style={styles.meta}>
        <span style={styles.badge}>
          {instance.loader === 'fabric' ? 'Fabric' : 'Vanilla'}
        </span>
        <span style={styles.memory}>
          {instance.minMemory}G - {instance.maxMemory}G RAM
        </span>
        {instance.lastPlayed && (
          <span style={styles.lastPlayed}>
            Played {new Date(instance.lastPlayed).toLocaleDateString()}
          </span>
        )}
      </div>
    </GlassPanel>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: 20,
    minWidth: 280,
    maxWidth: 340,
    flex: '1 1 280px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(108, 92, 231, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  version: {
    fontSize: 13,
    color: '#888',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '3px 10px',
    borderRadius: 6,
    background: 'rgba(108, 92, 231, 0.15)',
    color: '#a29bfe',
    fontSize: 12,
    fontWeight: 600,
  },
  memory: {
    fontSize: 12,
    color: '#888',
  },
  lastPlayed: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
}
