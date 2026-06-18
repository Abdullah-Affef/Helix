import { ipcMain, BrowserWindow } from 'electron'
import { launchInstance, getLaunchStatus } from '../core/launcher'

export function registerLauncherIpc() {
  ipcMain.handle('launcher:launch', async (event, instanceId: string) => {
    try {
      event.sender.send('console:log', `Launching instance ${instanceId}...`)
      await launchInstance(instanceId)
      event.sender.send('console:log', `Instance ${instanceId} launched`)
      return { success: true }
    } catch (err: any) {
      event.sender.send('console:log', `Launch failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('launcher:getStatus', (_event, instanceId: string) => {
    return getLaunchStatus(instanceId)
  })
}
