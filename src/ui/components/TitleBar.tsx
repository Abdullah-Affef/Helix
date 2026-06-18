import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscClose } from 'react-icons/vsc'
import { useState } from 'react'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)

  async function handleMinimize() {
    await window.api.window.minimize()
  }

  async function handleMaximize() {
    await window.api.window.maximize()
    setMaximized(!maximized)
  }

  async function handleClose() {
    await window.api.window.close()
  }

  const btnBase: React.CSSProperties = {
    width: 46,
    height: '100%',
    border: 'none',
    background: 'transparent',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }

  const closeStyle: React.CSSProperties = {
    ...btnBase,
    background: hoverClose ? '#e81123' : 'transparent',
    color: hoverClose ? '#fff' : '#888',
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 1000,
    }}>
      <div style={{ flex: 1, height: '100%', WebkitAppRegion: 'drag' } as any} />
      <div style={{ display: 'flex', height: '100%', WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={handleMinimize} style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title="Minimize">
          <VscChromeMinimize size={14} />
        </button>
        <button onClick={handleMaximize} style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title="Maximize">
          {maximized ? <VscChromeRestore size={14} /> : <VscChromeMaximize size={14} />}
        </button>
        <button onClick={handleClose} style={closeStyle}
          onMouseEnter={() => setHoverClose(true)}
          onMouseLeave={() => setHoverClose(false)}
          title="Close">
          <VscClose size={14} />
        </button>
      </div>
    </div>
  )
}
