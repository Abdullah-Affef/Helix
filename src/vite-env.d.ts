/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    api: {
      instances: {
        list: () => Promise<any[]>
        get: (id: string) => Promise<any | null>
        create: (data: any) => Promise<any>
        update: (id: string, data: any) => Promise<any>
        delete: (id: string) => Promise<void>
      }
      auth: {
        login: (provider: string, credentials: any) => Promise<any>
        logout: () => Promise<void>
        getSession: () => Promise<any>
      }
      versions: {
        list: () => Promise<any[]>
        getManifest: () => Promise<any>
        getVersion: (id: string) => Promise<any>
        getFabricVersions: (mcVersion: string) => Promise<any[]>
      }
      launcher: {
        launch: (instanceId: string) => Promise<{ success: boolean; error?: string }>
        getStatus: (instanceId: string) => Promise<{ running: boolean; pid?: number }>
        onLog: (callback: (data: string) => void) => () => void
        onExit: (callback: (code: number) => void) => () => void
      }
      modrinth: {
        searchProjects: (query: string, opts: any) => Promise<any>
        getProject: (id: string) => Promise<any>
        getProjectVersions: (projectId: string, opts: any) => Promise<any[]>
        installProject: (projectId: string, versionId: string, instanceId: string, projectType?: string) => Promise<any>
        installMrpack: (mrpackPath: string, instanceId: string) => Promise<any>
        installMrpackFromUrl: (url: string, instanceId: string) => Promise<any>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<void>
      }
      dialog: {
        selectDirectory: () => Promise<string | null>
      }
      setup: {
        isCompleted: () => Promise<boolean>
        complete: (launcherDir?: string, instancesDir?: string) => Promise<void>
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      platform: string
      onDownloadProgress: (callback: (data: { label: string; percent: number; bytesDownloaded: number; bytesTotal: number } | null) => void) => () => void
      onConsoleLog: (callback: (text: string) => void) => () => void
      update: {
        check: () => Promise<void>
        download: () => Promise<void>
        install: () => Promise<void>
        onStatus: (callback: (status: UpdateStatus) => void) => () => void
      }
    }
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
}
