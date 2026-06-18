import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, width = 500 }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={styles.overlay}
    >
      <div style={{ ...styles.modal, maxWidth: width }}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    background: 'rgba(22, 22, 40, 0.98)',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#e0e0e0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
  },
  body: {
    padding: 24,
    maxHeight: '60vh',
    overflow: 'auto',
  },
}
