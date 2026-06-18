import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import GlassPanel from '../components/GlassPanel'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { FiSearch, FiDownload, FiArchive, FiImage, FiSun, FiPackage, FiFilter } from 'react-icons/fi'
import Skeleton from '../components/Skeleton'

interface ModrinthProject {
  project_id: string
  slug: string
  title: string
  description: string
  project_type: string
  icon_url: string | null
  downloads: number
  versions: string[]
  latest_version: string
}

type ContentType = 'mod' | 'resourcepack' | 'shader' | 'modpack'

const contentTypeInfo: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
  mod: { label: 'Mods', icon: <FiArchive size={18} />, color: '#6c5ce7' },
  resourcepack: { label: 'Resource Packs', icon: <FiImage size={18} />, color: '#00b894' },
  shader: { label: 'Shaders', icon: <FiSun size={18} />, color: '#fdcb6e' },
  modpack: { label: 'Modpacks', icon: <FiPackage size={18} />, color: '#e17055' },
}

export default function Browse() {
  const [activeType, setActiveType] = useState<ContentType>('mod')
  const [items, setItems] = useState<ModrinthProject[]>([])
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [installTarget, setInstallTarget] = useState<ModrinthProject | null>(null)
  const [filterVersion, setFilterVersion] = useState('')
  const [filterInstanceId, setFilterInstanceId] = useState('')
  const [mcVersions, setMcVersions] = useState<string[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<any>(null)
  const loadedOnce = useRef(false)
  const instances = useStore((s) => s.instances)
  const [installing, setInstalling] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)
  const [installSuccess, setInstallSuccess] = useState<string | null>(null)

  const contentTypes: ContentType[] = ['mod', 'resourcepack', 'shader', 'modpack']
  const needsInstance = activeType === 'mod' || activeType === 'modpack'
  const needsVersion = activeType === 'resourcepack' || activeType === 'shader'

  useEffect(() => {
    loadVersions()
  }, [])

  useEffect(() => {
    setFilterVersion('')
    setFilterInstanceId('')
  }, [activeType])

  useEffect(() => {
    resetAndLoad()
  }, [activeType, filterVersion, filterInstanceId])

  async function loadVersions() {
    try {
      const manifest = await window.api.versions.list()
      const releases = manifest
        .filter((v: any) => v.type === 'release')
        .slice(0, 30)
        .map((v: any) => v.id)
      setMcVersions(releases)
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  useEffect(() => {
    if (items.length === 0 || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [items.length, hasMore, loading])

  const activeVersion = needsInstance
    ? instances.find((i) => i.id === filterInstanceId)?.version || ''
    : filterVersion

  async function resetAndLoad() {
    setItems([])
    setOffset(0)
    setHasMore(true)
    setQuery('')
    setLoading(true)
    try {
      const facets: string[][] = []
      facets.push([`project_type:${activeType}`])
      if (activeVersion) facets.push([`versions:${activeVersion}`])

      const result = await window.api.modrinth.searchProjects('', {
        facets,
        limit: 24,
        offset: 0,
        index: 'downloads',
      })

      setItems(result.hits || [])
      setOffset(24)
      setHasMore(result.hits?.length === 24)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
      loadedOnce.current = true
    }
  }

  async function loadMore() {
    if (loading) return
    setLoading(true)
    try {
      const facets: string[][] = []
      facets.push([`project_type:${activeType}`])
      if (activeVersion) facets.push([`versions:${activeVersion}`])

      const result = await window.api.modrinth.searchProjects(query, {
        facets,
        limit: 24,
        offset,
        index: query ? 'relevance' : 'downloads',
      })

      setItems((prev) => [...prev, ...(result.hits || [])])
      setOffset((prev) => prev + 24)
      setHasMore(result.hits?.length === 24)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      if (!val) {
        resetAndLoad()
        return
      }
      setItems([])
      setOffset(0)
      setHasMore(true)
      setLoading(true)
      try {
        const facets: string[][] = []
        facets.push([`project_type:${activeType}`])
        if (activeVersion) facets.push([`versions:${activeVersion}`])

        const result = await window.api.modrinth.searchProjects(val, {
          facets,
          limit: 24,
          offset: 0,
          index: 'relevance',
        })

        setItems(result.hits || [])
        setOffset(24)
        setHasMore(result.hits?.length === 24)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
        loadedOnce.current = true
      }
    }, 300)
  }

  async function handleInstall(projectId: string, projectTitle: string) {
    try {
      let versions = await window.api.modrinth.getProjectVersions(projectId, {})
      if (versions.length === 0) throw new Error('No compatible version found')

      if (instances.length === 0) {
        setInstallError('No instances available. Create one first.')
        return
      }

      setInstallTarget(items.find((i) => i.project_id === projectId) || null)
    } catch (err: any) {
      setInstallError(err.message || 'Failed to get project versions')
    }
  }

  async function confirmInstall(instanceId: string) {
    if (!installTarget) return
    setInstalling(true)
    setInstallError(null)
    try {
      const versions = await window.api.modrinth.getProjectVersions(installTarget.project_id, {})
      if (versions.length === 0) throw new Error('No compatible version found')
      await window.api.modrinth.installProject(installTarget.project_id, versions[0].id, instanceId, activeType)
      setInstallTarget(null)
      setInstallSuccess(`Installed ${installTarget.title}`)
      setTimeout(() => setInstallSuccess(null), 3000)
    } catch (err: any) {
      setInstallError(err.message || 'Install failed')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Browse</h1>
          <p style={styles.subtitle}>Discover mods, resource packs, shaders, and modpacks</p>
        </div>
      </div>

      <div style={styles.tabs}>
        {contentTypes.map((type) => {
          const info = contentTypeInfo[type]
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                ...styles.tab,
                color: activeType === type ? info.color : 'var(--text-muted)',
                borderBottom: activeType === type ? `2px solid ${info.color}` : '2px solid transparent',
                background: activeType === type ? `${info.color}10` : 'transparent',
              }}
            >
              {info.icon}
              {info.label}
            </button>
          )
        })}
      </div>

      <div style={styles.searchWrap}>
        <FiSearch size={16} style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          value={query}
          onChange={handleSearch}
          placeholder={`Search ${contentTypeInfo[activeType].label.toLowerCase()}...`}
        />
      </div>

      <div style={styles.filterBar}>
        {needsInstance && (
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Instance:</span>
            <select
              style={styles.filterSelect}
              value={filterInstanceId}
              onChange={(e) => setFilterInstanceId(e.target.value)}
            >
              <option value="" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>All versions</option>
              {instances.map((inst) => (
                <option key={inst.id} value={inst.id} style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>{inst.name} ({inst.version})</option>
              ))}
            </select>
          </div>
        )}
        {needsVersion && (
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Version:</span>
            <select
              style={styles.filterSelect}
              value={filterVersion}
              onChange={(e) => setFilterVersion(e.target.value)}
            >
              <option value="" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>All versions</option>
              {mcVersions.map((v) => (
                <option key={v} value={v} style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>{v}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.project_id} style={styles.card}>
            {item.icon_url ? (
              <img src={item.icon_url} alt="" style={styles.cardIcon}
                onError={(e: any) => { e.target.style.display = 'none' }} />
            ) : (
              <div style={styles.cardIconPlaceholder}>
                {contentTypeInfo[activeType].icon}
              </div>
            )}
            <div style={styles.cardBody}>
              <strong style={styles.cardTitle}>{item.title}</strong>
              <p style={styles.cardDesc}>{item.description?.slice(0, 100)}</p>
              <span style={styles.cardDownloads}>
                {item.downloads.toLocaleString()} downloads
              </span>
            </div>
            <div style={styles.cardActions}>
              <Button size="sm" onClick={() => handleInstall(item.project_id, item.title)}>
                <FiDownload size={12} /> Install
              </Button>
            </div>
          </div>
        ))}
        {loading && (
          <div style={styles.skeletonList}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={styles.card}>
                <Skeleton width={44} height={44} borderRadius={10} />
                <div style={styles.cardBody}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
                  <Skeleton width="30%" height={10} style={{ marginTop: 4 }} />
                </div>
                <Skeleton width={70} height={28} borderRadius={6} />
              </div>
            ))}
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {!hasMore && items.length > 0 && (
          <div style={styles.endText}>You've reached the end!</div>
        )}
        {items.length === 0 && !loading && loadedOnce.current && (
          <div style={styles.empty}>
            <p>No {contentTypeInfo[activeType].label.toLowerCase()} found.</p>
          </div>
        )}
      </div>

      <Modal open={!!installTarget} onClose={() => { setInstallTarget(null); setInstallError(null) }} title="Select Instance" width={450}>
        {instances.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No instances available. Create an instance first.
          </p>
        ) : (
          <div style={styles.instanceList}>
            {instances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => confirmInstall(inst.id)}
                style={styles.instanceItem}
                disabled={installing}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{inst.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{inst.version} - {inst.loader}</span>
                </div>
                <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
                  {installing ? '...' : 'Install'}
                </span>
              </button>
            ))}
          </div>
        )}
        {installError && (
          <div style={styles.error}>{installError}</div>
        )}
      </Modal>
      {installSuccess && (
        <div style={styles.successToast}>{installSuccess}</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    animation: 'fadeIn 0.4s ease',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: '4px 0 0',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '1px solid var(--border)',
  },
  tab: {
    padding: '10px 18px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap' as const,
    borderRadius: '8px 8px 0 0',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 20,
    maxWidth: 500,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    background: 'var(--bg-glass)',
    border: '1px solid var(--border)',
    transition: 'background 0.2s ease',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  cardIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'var(--bg-glass-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--text-muted)',
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    color: 'var(--text-primary)',
    display: 'block',
  },
  cardDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    margin: '2px 0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardDownloads: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  cardActions: {
    flexShrink: 0,
  },
  skeletonList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  filterBar: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  },
  filterSelect: {
    padding: '8px 32px 8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-hover)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    WebkitAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23888%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: 180,
    transition: 'border-color 0.2s ease',
  },
  endText: {
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    fontSize: 13,
    padding: 20,
  },
  empty: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: 14,
    padding: 40,
  },
  instanceList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  instanceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg-glass)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'background 0.2s ease',
  },
  error: {
    marginTop: 12,
    padding: '10px 14px',
    background: 'rgba(255, 82, 82, 0.1)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    borderRadius: 8,
    color: 'var(--danger)',
    fontSize: 13,
  },
  successToast: {
    position: 'fixed',
    bottom: 32,
    right: 32,
    padding: '12px 20px',
    background: 'rgba(0, 230, 118, 0.15)',
    border: '1px solid rgba(0, 230, 118, 0.3)',
    borderRadius: 10,
    color: 'var(--success)',
    fontSize: 14,
    fontWeight: 600,
    zIndex: 200,
    animation: 'fadeIn 0.3s ease',
  },
}
