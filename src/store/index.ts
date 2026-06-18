import { create } from 'zustand'

interface Instance {
  id: string
  name: string
  version: string
  loader: 'vanilla' | 'fabric'
  createdAt: number
  icon: string
  minMemory: number
  maxMemory: number
  javaArgs: string
  gameDir: string | null
  lastPlayed: number | null
}

interface AuthSession {
  provider: string
  username: string
  accessToken?: string
  uuid?: string
}

interface ConsoleLine {
  timestamp: number
  text: string
}

interface UpdateStatus {
  type: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  percent?: number
  message?: string
  releaseNotes?: string
  bytesPerSecond?: number
  transferred?: number
  total?: number
}

interface DownloadProgress {
  label: string
  percent: number
  bytesDownloaded: number
  bytesTotal: number
}

interface AppState {
  instances: Instance[]
  selectedInstance: Instance | null
  auth: AuthSession | null
  sidebarCollapsed: boolean
  loading: boolean
  logs: { instanceId: string; lines: string[] }[]
  consoleLines: ConsoleLine[]
  downloadProgress: DownloadProgress | null
  updateStatus: UpdateStatus | null

  setInstances: (instances: Instance[]) => void
  setSelectedInstance: (instance: Instance | null) => void
  setAuth: (auth: AuthSession | null) => void
  toggleSidebar: () => void
  setLoading: (loading: boolean) => void
  addLog: (instanceId: string, line: string) => void
  clearLogs: (instanceId: string) => void
  addConsoleLine: (text: string) => void
  setDownloadProgress: (progress: DownloadProgress | null) => void
  setUpdateStatus: (status: UpdateStatus | null) => void
  clearConsole: () => void
}

export const useStore = create<AppState>((set) => ({
  instances: [],
  selectedInstance: null,
  auth: null,
  sidebarCollapsed: false,
  loading: false,
  logs: [],
  consoleLines: [],
  downloadProgress: null,
  updateStatus: null,

  setInstances: (instances) => set({ instances }),
  setSelectedInstance: (instance) => set({ selectedInstance: instance }),
  setAuth: (auth) => set({ auth }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLoading: (loading) => set({ loading }),
  addLog: (instanceId, line) =>
    set((s) => {
      const existing = s.logs.find((l) => l.instanceId === instanceId)
      if (existing) {
        existing.lines.push(line)
        return { logs: [...s.logs] }
      }
      return { logs: [...s.logs, { instanceId, lines: [line] }] }
    }),
  clearLogs: (instanceId) =>
    set((s) => ({
      logs: s.logs.filter((l) => l.instanceId !== instanceId),
    })),
  addConsoleLine: (text) =>
    set((s) => ({
      consoleLines: [...s.consoleLines, { timestamp: Date.now(), text }].slice(-200),
    })),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setUpdateStatus: (status) => set({ updateStatus: status }),
  clearConsole: () => set({ consoleLines: [] }),
}))
