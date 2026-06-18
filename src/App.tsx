import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from './store'
import Layout from './ui/components/Layout'
import Setup from './ui/pages/Setup'
import Home from './ui/pages/Home'
import Instances from './ui/pages/Instances'
import InstanceDetail from './ui/pages/InstanceDetail'
import Settings from './ui/pages/Settings'
import Auth from './ui/pages/Auth'
import Browse from './ui/pages/Browse'
import { applyTheme, getSavedTheme } from './ui/styles/themes'

export default function App() {
  const setInstances = useStore((s) => s.setInstances)
  const setAuth = useStore((s) => s.setAuth)
  const addConsoleLine = useStore((s) => s.addConsoleLine)
  const setDownloadProgress = useStore((s) => s.setDownloadProgress)
  const [themeReady, setThemeReady] = useState(false)
  const [setupReady, setSetupReady] = useState(false)
  const [setupDone, setSetupDone] = useState(false)

  useEffect(() => {
    applyTheme(getSavedTheme())
    setThemeReady(true)

    window.api.setup.isCompleted().then((done) => {
      setSetupDone(done)
      setSetupReady(true)
      if (done) loadInitialData()
    })

    const unsubProgress = window.api.onDownloadProgress((data) => {
      setDownloadProgress(data)
    })
    const unsubConsole = window.api.onConsoleLog((text) => {
      addConsoleLine(text)
    })

    return () => {
      unsubProgress()
      unsubConsole()
    }
  }, [])

  async function loadInitialData() {
    try {
      const [instances, session] = await Promise.all([
        window.api.instances.list(),
        window.api.auth.getSession(),
      ])
      setInstances(instances)
      if (session) setAuth(session)
    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }

  async function handleSetupComplete() {
    setSetupDone(true)
    loadInitialData()
  }

  if (!themeReady || !setupReady) return null

  if (!setupDone) {
    return <Setup onComplete={handleSetupComplete} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instances" element={<Instances />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Layout>
  )
}
