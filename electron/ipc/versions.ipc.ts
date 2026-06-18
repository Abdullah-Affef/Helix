import { ipcMain } from 'electron'
import { fetchVersionManifest, getVersionInfo, getFabricLoaderVersions } from '../core/versions'

export function registerVersionsIpc() {
  ipcMain.handle('versions:list', async () => {
    const manifest = await fetchVersionManifest()
    return manifest.versions
  })

  ipcMain.handle('versions:getManifest', async () => {
    return fetchVersionManifest()
  })

  ipcMain.handle('versions:getVersion', async (_event, id: string) => {
    return getVersionInfo(id)
  })

  ipcMain.handle('versions:getFabricVersions', async (_event, mcVersion: string) => {
    return getFabricLoaderVersions(mcVersion)
  })
}
