import { ipcMain } from 'electron'
import { listInstances, getInstance, createInstance, updateInstance, deleteInstance } from '../core/instances'

export function registerInstanceIpc() {
  ipcMain.handle('instances:list', () => {
    return listInstances()
  })

  ipcMain.handle('instances:get', (_event, id: string) => {
    return getInstance(id)
  })

  ipcMain.handle('instances:create', (_event, data: any) => {
    return createInstance(data)
  })

  ipcMain.handle('instances:update', (_event, id: string, data: any) => {
    return updateInstance(id, data)
  })

  ipcMain.handle('instances:delete', (_event, id: string) => {
    return deleteInstance(id)
  })
}
