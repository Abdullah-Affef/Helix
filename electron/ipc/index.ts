import { ipcMain, BrowserWindow } from 'electron'
import { registerInstanceIpc } from './instances.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerVersionsIpc } from './versions.ipc'
import { registerLauncherIpc } from './launcher.ipc'
import { registerModrinthIpc } from './modrinth.ipc'
import { registerSettingsIpc } from './settings.ipc'

export function registerIpcHandlers() {
  registerInstanceIpc()
  registerAuthIpc()
  registerVersionsIpc()
  registerLauncherIpc()
  registerModrinthIpc()
  registerSettingsIpc()

  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getAllWindows()[0]?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    BrowserWindow.getAllWindows()[0]?.close()
  })
}
