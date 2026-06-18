import { contextBridge, ipcRenderer } from 'electron'

const api = {
  instances: {
    list: () => ipcRenderer.invoke('instances:list'),
    get: (id: string) => ipcRenderer.invoke('instances:get', id),
    create: (data: any) => ipcRenderer.invoke('instances:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('instances:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('instances:delete', id),
  },
  auth: {
    login: (provider: string, credentials: any) =>
      ipcRenderer.invoke('auth:login', provider, credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getSession: () => ipcRenderer.invoke('auth:getSession'),
  },
  versions: {
    list: () => ipcRenderer.invoke('versions:list'),
    getManifest: () => ipcRenderer.invoke('versions:getManifest'),
    getVersion: (id: string) => ipcRenderer.invoke('versions:getVersion', id),
    getFabricVersions: (mcVersion: string) =>
      ipcRenderer.invoke('versions:getFabricVersions', mcVersion),
  },
  launcher: {
    launch: (instanceId: string) => ipcRenderer.invoke('launcher:launch', instanceId),
    getStatus: (instanceId: string) => ipcRenderer.invoke('launcher:getStatus', instanceId),
    onLog: (callback: (data: string) => void) => {
      const handler = (_event: any, data: string) => callback(data)
      ipcRenderer.on('launcher:log', handler)
      return () => ipcRenderer.removeListener('launcher:log', handler)
    },
    onExit: (callback: (code: number) => void) => {
      const handler = (_event: any, code: number) => callback(code)
      ipcRenderer.on('launcher:exit', handler)
      return () => ipcRenderer.removeListener('launcher:exit', handler)
    },
  },
  modrinth: {
    searchProjects: (query: string, opts: any) =>
      ipcRenderer.invoke('modrinth:search', query, opts),
    getProject: (id: string) => ipcRenderer.invoke('modrinth:getProject', id),
    getProjectVersions: (projectId: string, opts: any) =>
      ipcRenderer.invoke('modrinth:getProjectVersions', projectId, opts),
    installProject: (projectId: string, versionId: string, instanceId: string, projectType?: string) =>
      ipcRenderer.invoke('modrinth:install', projectId, versionId, instanceId, projectType),
    installMrpack: (mrpackPath: string, instanceId: string) =>
      ipcRenderer.invoke('modrinth:installMrpack', mrpackPath, instanceId),
    installMrpackFromUrl: (url: string, instanceId: string) =>
      ipcRenderer.invoke('modrinth:installMrpackFromUrl', url, instanceId),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  },
  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  },
  setup: {
    isCompleted: () => ipcRenderer.invoke('setup:isCompleted'),
    complete: (launcherDir?: string, instancesDir?: string) =>
      ipcRenderer.invoke('setup:complete', launcherDir, instancesDir),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  platform: process.platform,
  onDownloadProgress: (callback: (data: { label: string; percent: number; bytesDownloaded: number; bytesTotal: number } | null) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  },
  onConsoleLog: (callback: (text: string) => void) => {
    const handler = (_event: any, text: string) => callback(text)
    ipcRenderer.on('console:log', handler)
    return () => ipcRenderer.removeListener('console:log', handler)
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatus: (callback: (status: any) => void) => {
      const handler = (_event: any, status: any) => callback(status)
      ipcRenderer.on('update:status', handler)
      return () => ipcRenderer.removeListener('update:status', handler)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
