import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import GlassPanel from '../components/GlassPanel'
import InstanceCard from '../components/InstanceCard'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Select from '../components/Select'
import { FiPlus, FiBox } from 'react-icons/fi'

export default function Instances() {
  const instances = useStore((s) => s.instances)
  const setInstances = useStore((s) => s.setInstances)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    version: '1.21',
    loader: 'vanilla' as 'vanilla' | 'fabric',
    minMemory: 2,
    maxMemory: 4,
  })
  const [versions, setVersions] = useState<string[]>([])

  useEffect(() => {
    loadVersions()
    refreshInstances()
  }, [])

  async function loadVersions() {
    try {
      const manifest = await window.api.versions.list()
      const releases = manifest
        .filter((v: any) => v.type === 'release')
        .slice(0, 30)
        .map((v: any) => v.id)
      setVersions(releases)
      if (releases.length > 0) {
        setForm((f) => ({ ...f, version: releases[0] }))
      }
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  async function refreshInstances() {
    const list = await window.api.instances.list()
    setInstances(list)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await window.api.instances.create(form)
      setCreateOpen(false)
      setForm({ name: '', version: versions[0] || '1.21', loader: 'vanilla', minMemory: 2, maxMemory: 4 })
      await refreshInstances()
    } catch (err) {
      console.error('Failed to create instance:', err)
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Instances</h1>
        <button onClick={() => setCreateOpen(true)} style={styles.addBtn}>
          <FiPlus size={22} />
        </button>
      </div>

      {instances.length === 0 ? (
        <GlassPanel style={styles.empty}>
          <FiBox size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={styles.emptyText}>No instances created yet.</p>
        </GlassPanel>
      ) : (
        <div style={styles.grid}>
          {instances.map((inst) => (
            <InstanceCard key={inst.id} instance={inst} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Instance">
        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Instance"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Minecraft Version</label>
            <Select
              value={form.version}
              onChange={(v) => setForm({ ...form, version: v })}
              options={versions}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Loader</label>
            <div style={styles.toggleGroup}>
              <button
                type="button"
                onClick={() => setForm({ ...form, loader: 'vanilla' })}
                style={{
                  ...styles.toggleBtn,
                  background: form.loader === 'vanilla' ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--bg-glass)',
                  borderColor: form.loader === 'vanilla' ? 'var(--accent)' : 'var(--border)',
                }}
              >
                Vanilla
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, loader: 'fabric' })}
                style={{
                  ...styles.toggleBtn,
                  background: form.loader === 'fabric' ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--bg-glass)',
                  borderColor: form.loader === 'fabric' ? 'var(--accent)' : 'var(--border)',
                }}
              >
                Fabric
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Min RAM: {form.minMemory}G</label>
            <input
              type="range"
              min={1} max={16}
              value={form.minMemory}
              onChange={(e) => setForm({ ...form, minMemory: Number(e.target.value) })}
              style={styles.range}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Max RAM: {form.maxMemory}G</label>
            <input
              type="range"
              min={1} max={16}
              value={form.maxMemory}
              onChange={(e) => setForm({ ...form, maxMemory: Number(e.target.value) })}
              style={styles.range}
            />
          </div>

          <Button type="submit" style={{ width: '100%', marginTop: 8 }}>
            Create Instance
          </Button>
        </form>
      </Modal>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    animation: 'fadeIn 0.4s ease',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
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
  },

  toggleGroup: {
    display: 'flex',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid',
    color: 'var(--text-primary)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)',
  },
}
