import { ipcMain } from 'electron'
import * as modrinth from '../core/modrinth'
import { installMrpack, installMrpackFromUrl } from '../core/modrinth/mrpack'
import path from 'path'

export function registerModrinthIpc() {
  ipcMain.handle('modrinth:search', async (_event, query: string, opts: any) => {
    return modrinth.search(query, opts)
  })

  ipcMain.handle('modrinth:getProject', async (_event, id: string) => {
    return modrinth.getProjectInfo(id)
  })

  ipcMain.handle('modrinth:getProjectVersions', async (_event, projectId: string, opts: any) => {
    try {
      return await modrinth.getVersions(projectId, opts)
    } catch (err: any) {
      return []
    }
  })

  ipcMain.handle('modrinth:install', async (event, projectId: string, versionId: string, instanceId: string, projectType?: string) => {
    try {
      event.sender.send('console:log', `Starting download...`)
      const filePath = await modrinth.installProject(
        projectId, versionId, instanceId, projectType,
        (downloaded, total) => {
          event.sender.send('download:progress', {
            label: `Downloading mod...`,
            percent: Math.round((downloaded / total) * 100),
            bytesDownloaded: downloaded,
            bytesTotal: total,
          })
        },
      )
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Installed ${path.basename(filePath)}`)
      return { success: true, filePath }
    } catch (err: any) {
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Install failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('modrinth:installMrpack', async (event, mrpackPath: string, instanceId: string) => {
    try {
      event.sender.send('console:log', `Installing modpack...`)
      const result = await installMrpack(mrpackPath, instanceId, (current, total, fileName) => {
        event.sender.send('download:progress', {
          label: `Downloading ${fileName} (${current}/${total})`,
          percent: Math.round((current / total) * 100),
          bytesDownloaded: 0,
          bytesTotal: 0,
        })
      })
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Modpack installed: ${result.name} (${result.filesInstalled} files)`)
      return { success: true, ...result }
    } catch (err: any) {
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Modpack install failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('modrinth:installMrpackFromUrl', async (event, url: string, instanceId: string) => {
    try {
      event.sender.send('console:log', `Downloading modpack from URL...`)
      const result = await installMrpackFromUrl(url, instanceId, (current, total, fileName) => {
        event.sender.send('download:progress', {
          label: `Downloading ${fileName} (${current}/${total})`,
          percent: Math.round((current / total) * 100),
          bytesDownloaded: 0,
          bytesTotal: 0,
        })
      })
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Modpack installed: ${result.name} (${result.filesInstalled} files)`)
      return { success: true, ...result }
    } catch (err: any) {
      event.sender.send('download:progress', null)
      event.sender.send('console:log', `Modpack install failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  })
}
