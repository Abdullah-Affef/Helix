import { ipcMain, dialog } from 'electron'
import { getSetting, setSetting } from '../core/settings'

export function registerSettingsIpc() {
  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
