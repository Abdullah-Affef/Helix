import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import GlassPanel from '../components/GlassPanel'
import Button from '../components/Button'
import Modal from '../components/Modal'
import StatusDot from '../components/StatusDot'
import Skeleton from '../components/Skeleton'
import { FiPlay, FiArchive, FiImage, FiSun, FiSettings, FiArrowLeft, FiSearch, FiDownload, FiTrash2 } from 'react-icons/fi'
import ProgressConsole from '../components/ProgressConsole'

type Tab = 'play' | 'mods' | 'resourcepacks' | 'shaders' | 'modpacks' | 'settings'

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

const tabIcons: Record<Tab, React.ReactNode> = {
  play: <FiPlay size={16} />,
  mods: <FiArchive size={16} />,
  resourcepacks: <FiImage size={16} />,
  shaders: <FiSun size={16} />,
  modpacks: <FiDownload size={16} />,
  settings: <FiSettings size={16} />,
}

export default function InstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [instance, setInstance] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('play')
  const [logs, setLogs] = useState<string[]>([])
  const [launching, setLaunching] = useState(false)
  const [running, setRunning] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadInstance()
    const unsubLog = window.api.launcher.onLog((data) => {
      setLogs((prev) => [...prev.slice(-200), data])
    })
    const unsubExit = window.api.launcher.onExit((code) => {
      setRunning(false)
      setLaunching(false)
      setLogs((prev) => [...prev, `\nProcess exited with code ${code}`])
    })
    return () => { unsubLog(); unsubExit() }
  }, [id])

  async function loadInstance() {
    if (!id) return
    const inst = await window.api.instances.get(id)
    if (inst) {
      setInstance(inst)
      const status = await window.api.launcher.getStatus(id)
      setRunning(status.running)
    } else {
      navigate('/instances')
    }
  }

  async function handleLaunch() {
    if (!instance || launching) return
    setLaunching(true)
    setLaunchError(null)
    setLogs([])
    const result = await window.api.launcher.launch(instance.id)
    if (result.success) {
      setRunning(true)
      await window.api.instances.update(instance.id, { lastPlayed: Date.now() })
    } else {
      setLaunchError(result.error || 'Launch failed')
      setLaunching(false)
    }
  }

  async function handleDelete() {
    if (!instance) return
    await window.api.instances.delete(instance.id)
    navigate('/instances')
  }

  async function handleSaveSettings(data: any) {
    if (!instance) return
    const updated = await window.api.instances.update(instance.id, data)
    setInstance(updated)
  }

  if (!instance) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'play', label: 'Play' },
    { key: 'mods', label: 'Mods' },
    { key: 'resourcepacks', label: 'Resource Packs' },
    { key: 'shaders', label: 'Shaders' },
    { key: 'modpacks', label: 'Modpacks' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <div>
      <div style={styles.header}>
        <button onClick={() => navigate('/instances')} style={styles.backBtn}>
          <FiArrowLeft size={16} /> Back
        </button>
        <h1 style={styles.title}>{instance.name}</h1>
        <div style={styles.status}>
          <StatusDot status={running ? 'online' : 'offline'} size={8} />
          <span style={styles.statusText}>{running ? 'Running' : 'Stopped'}</span>
        </div>
      </div>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tabIcons[tab.key]}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'play' && (
        <PlayTab instance={instance} launching={launching} running={running} launchError={launchError} logs={logs} onLaunch={handleLaunch} onDelete={handleDelete} />
      )}
      {activeTab === 'mods' && <ContentBrowser instance={instance} projectType="mod" />}
      {activeTab === 'resourcepacks' && <ContentBrowser instance={instance} projectType="resourcepack" />}
      {activeTab === 'shaders' && <ContentBrowser instance={instance} projectType="shader" />}
      {activeTab === 'modpacks' && <ContentBrowser instance={instance} projectType="modpack" />}
      {activeTab === 'settings' && <SettingsTab instance={instance} onSave={handleSaveSettings} />}
    </div>
  )
}

function PlayTab({ instance, launching, running, launchError, logs, onLaunch, onDelete }: any) {
  return (
    <GlassPanel>
      <div style={styles.playSection}>
        <h2 style={styles.playTitle}>Launch Instance</h2>
        <div style={styles.playInfo}>
          <span>Version: {instance.version}</span>
          <span>Loader: {instance.loader}</span>
          <span>RAM: {instance.minMemory}G - {instance.maxMemory}G</span>
        </div>
        {launchError && <div style={styles.error}>{launchError}</div>}
        <div style={styles.playActions}>
          <Button onClick={onLaunch} disabled={launching || running} size="lg">
            <FiPlay size={18} /> {launching ? 'Launching...' : running ? 'Already Running' : 'Launch'}
          </Button>
          <Button onClick={onDelete} variant="danger" size="sm">
            <FiTrash2 size={14} /> Delete
          </Button>
        </div>
        {logs.length > 0 && (
          <div style={styles.logs}>
            <h3 style={styles.logsTitle}>Console</h3>
            <div style={styles.logContainer}>
              {logs.map((line: string, i: number) => (
                <div key={i} style={styles.logLine}>{line}</div>
              ))}
            </div>
          </div>
        )}
        <ProgressConsole />
      </div>
    </GlassPanel>
  )
}

function ContentBrowser({ instance, projectType }: { instance: any; projectType: string }) {
  const [items, setItems] = useState<ModrinthProject[]>([])
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(true)
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [installMsg, setInstallMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<any>(null)

  useEffect(() => {
    setInstallMsg(null)
    if (!showSearch) {
      setItems([])
      setOffset(0)
      return
    }
    loadItems(0, true)
  }, [showSearch, instance?.version, instance?.loader])

  useEffect(() => {
    if (!showSearch || items.length === 0 || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadItems(offset, false)
        }
      },
      { threshold: 0.1 },
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [showSearch, items.length, hasMore, loading, offset])

  async function loadItems(startOffset: number, reset: boolean) {
    if (loading) return
    setLoading(true)
    try {
      const facets: string[][] = []
      facets.push([`project_type:${projectType}`])
      if (projectType !== 'modpack') {
        facets.push([`versions:${instance.version}`])
        if (instance.loader === 'fabric' && projectType === 'mod') {
          facets.push(['categories:fabric'])
        }
      }

      const result = await window.api.modrinth.searchProjects(query, {
        facets,
        limit: 20,
        offset: startOffset,
        index: query ? 'relevance' : 'downloads',
      })

      if (reset) {
        setItems(result.hits || [])
      } else {
        setItems((prev) => [...prev, ...(result.hits || [])])
      }
      setOffset(startOffset + 20)
      setHasMore(result.hits?.length === 20)
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
    searchTimeoutRef.current = setTimeout(() => {
      setOffset(0)
      setItems([])
      setHasMore(true)
      loadItems(0, true)
    }, 300)
  }

  const labelMap: Record<string, string> = {
    mod: 'Mods',
    resourcepack: 'Resource Packs',
    shader: 'Shaders',
    modpack: 'Modpacks',
  }

  async function handleInstall(projectId: string) {
    setInstallingId(projectId)
    setInstallMsg(null)
    try {
      let versions = await window.api.modrinth.getProjectVersions(projectId, {
        gameVersions: projectType === 'modpack' ? undefined : [instance.version],
        loaders: (instance.loader === 'fabric' && projectType === 'mod') ? ['fabric'] : undefined,
      })
      if (versions.length === 0) {
        versions = await window.api.modrinth.getProjectVersions(projectId, {})
      }
      if (versions.length === 0) throw new Error('No compatible version found')
      await window.api.modrinth.installProject(projectId, versions[0].id, instance.id, projectType)
      setInstallMsg({ type: 'success', text: 'Installed successfully' })
    } catch (err: any) {
      setInstallMsg({ type: 'error', text: err.message || 'Install failed' })
    } finally {
      setInstallingId(null)
    }
  }

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.sectionTitle}>{labelMap[projectType] || projectType}</h2>
        <Button onClick={() => setShowSearch(!showSearch)} size="sm">
          <FiSearch size={14} /> {showSearch ? 'Close' : 'Browse Modrinth'}
        </Button>
      </div>

      {showSearch && (
        <GlassPanel style={{ marginBottom: 16 }}>
          <div style={styles.searchInputWrap}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)', position: 'absolute', left: 12, top: 12 }} />
            <input
              style={styles.searchInput}
              value={query}
              onChange={handleSearch}
              placeholder={`Search ${labelMap[projectType]?.toLowerCase() || 'projects'}...`}
              autoFocus
            />
          </div>

          {installMsg && (
            <div style={{
              ...styles.installBanner,
              background: installMsg.type === 'success'
                ? 'rgba(0, 230, 118, 0.1)'
                : 'rgba(255, 82, 82, 0.1)',
              borderColor: installMsg.type === 'success'
                ? 'rgba(0, 230, 118, 0.3)'
                : 'rgba(255, 82, 82, 0.3)',
              color: installMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            }}>
              {installMsg.text}
            </div>
          )}
          <div style={styles.resultsGrid}>
            {items.map((item) => (
              <div key={item.project_id} style={styles.resultCard}>
                {item.icon_url && (
                  <img src={item.icon_url} alt="" style={styles.resultIcon}
                    onError={(e: any) => { e.target.style.display = 'none' }} />
                )}
                <div style={styles.resultInfo}>
                  <strong style={styles.resultName}>{item.title}</strong>
                  <p style={styles.resultDesc}>{item.description?.slice(0, 80)}</p>
                  <span style={styles.resultDownloads}>
                    {item.downloads.toLocaleString()} downloads
                  </span>
                </div>
                <Button size="sm" onClick={() => handleInstall(item.project_id)} disabled={installingId === item.project_id}>
                  <FiDownload size={12} /> {installingId === item.project_id ? 'Installing...' : 'Install'}
                </Button>
              </div>
            ))}
            {loading && (
              <div style={styles.skeletonList}>
                {[1,2,3].map((i) => (
                  <div key={i} style={styles.resultCard}>
                    <Skeleton width={32} height={32} borderRadius={6} />
                    <div style={styles.resultInfo}>
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
                      <Skeleton width="25%" height={10} style={{ marginTop: 4 }} />
                    </div>
                    <Skeleton width={60} height={28} borderRadius={6} />
                  </div>
                ))}
              </div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {!hasMore && items.length > 0 && (
              <div style={styles.endText}>No more results</div>
            )}
            {items.length === 0 && !loading && query && (
              <div style={styles.endText}>No results found</div>
            )}
          </div>
        </GlassPanel>
      )}

      {!showSearch && (
        <GlassPanel>
          <p style={styles.placeholder}>
            Click "Browse Modrinth" to find and install {labelMap[projectType]?.toLowerCase() || 'content'}.
          </p>
        </GlassPanel>
      )}
    </div>
  )
}

function SettingsTab({ instance, onSave }: { instance: any; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ ...instance })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name: form.name,
      version: form.version,
      loader: form.loader,
      minMemory: form.minMemory,
      maxMemory: form.maxMemory,
      javaArgs: form.javaArgs,
    })
    setSaving(false)
  }

  return (
    <GlassPanel>
      <form onSubmit={handleSave} style={settingsStyles.form}>
        <h2 style={settingsStyles.title}>Instance Settings</h2>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Name</label>
          <input style={settingsStyles.input} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Loader</label>
          <select style={settingsStyles.select} value={form.loader}
            onChange={(e) => setForm({ ...form, loader: e.target.value })}>
            <option value="vanilla">Vanilla</option>
            <option value="fabric">Fabric</option>
          </select>
        </div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Min RAM: {form.minMemory}G</label>
          <input type="range" min={1} max={16} value={form.minMemory}
            onChange={(e) => setForm({ ...form, minMemory: Number(e.target.value) })}
            style={settingsStyles.range} />
        </div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Max RAM: {form.maxMemory}G</label>
          <input type="range" min={1} max={16} value={form.maxMemory}
            onChange={(e) => setForm({ ...form, maxMemory: Number(e.target.value) })}
            style={settingsStyles.range} />
        </div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Extra JVM Arguments</label>
          <input style={settingsStyles.input} value={form.javaArgs}
            onChange={(e) => setForm({ ...form, javaArgs: e.target.value })}
            placeholder="-XX:+UseG1GC ..." />
        </div>

        <Button type="submit" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </GlassPanel>
  )
}

const settingsStyles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 },
  title: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  select: { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', WebkitAppearance: 'none' as const, appearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23888%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 },
  range: { width: '100%', accentColor: 'var(--accent)' },
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 },
  status: { display: 'flex', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, color: 'var(--text-secondary)' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' },
  tab: { padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' as const },
  playSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  playTitle: { fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  playInfo: { display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' },
  playActions: { display: 'flex', gap: 12, alignItems: 'center' },
  error: { padding: '10px 14px', background: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 },
  logs: { marginTop: 8 },
  logsTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' },
  logContainer: { background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 12, maxHeight: 300, overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, lineHeight: '1.5' },
  logLine: { color: '#8f8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  tabHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  placeholder: { color: 'var(--text-secondary)', fontSize: 14, margin: 0 },
  searchInputWrap: { position: 'relative', marginBottom: 16 },
  searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
  resultsGrid: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflow: 'auto' },
  resultCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, background: 'var(--bg-glass)' },
  resultIcon: { width: 32, height: 32, borderRadius: 6, objectFit: 'cover' as const, flexShrink: 0 },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 14, color: 'var(--text-primary)', display: 'block' },
  resultDesc: { fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  resultDownloads: { fontSize: 11, color: 'var(--text-muted)' },
  installBanner: { padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, marginBottom: 12 },
  endText: { textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13, padding: 12 },
  skeletonList: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
}
