import { ipcMain } from 'electron'
import { login, saveSession, getSession, clearSession } from '../core/auth'

export function registerAuthIpc() {
  ipcMain.handle('auth:login', async (_event, provider: string, credentials: any) => {
    const session = await login(provider, credentials)
    saveSession(session)
    return session
  })

  ipcMain.handle('auth:logout', () => {
    clearSession()
  })

  ipcMain.handle('auth:getSession', () => {
    return getSession()
  })
}
