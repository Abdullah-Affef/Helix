import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc'
import { initDatabase } from './core/database'
import { isSetupCompleted, markSetupCompleted, setSetting } from './core/settings'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '..', 'src', 'assets', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.handle('setup:isCompleted', () => {
  return isSetupCompleted()
})

ipcMain.handle('setup:complete', (_event, launcherDir?: string, instancesDir?: string) => {
  if (launcherDir) setSetting('launcherDir', launcherDir)
  if (instancesDir) setSetting('instancesDir', instancesDir)
  markSetupCompleted()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
