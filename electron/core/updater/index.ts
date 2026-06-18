import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function initUpdater() {
  const win = () => BrowserWindow.getAllWindows()[0]

  autoUpdater.on('checking-for-update', () => {
    win()?.webContents.send('update:status', { type: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    win()?.webContents.send('update:status', {
      type: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', () => {
    win()?.webContents.send('update:status', { type: 'not-available' })
  })

  autoUpdater.on('error', (err) => {
    win()?.webContents.send('update:status', { type: 'error', message: err.message })
  })

  autoUpdater.on('download-progress', (progress) => {
    win()?.webContents.send('update:status', {
      type: 'downloading',
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    win()?.webContents.send('update:status', {
      type: 'downloaded',
      version: info.version,
    })
  })
}

export function checkForUpdates() {
  autoUpdater.checkForUpdates()
}

export function downloadUpdate() {
  autoUpdater.downloadUpdate()
}

export function quitAndInstall() {
  autoUpdater.quitAndInstall()
}
