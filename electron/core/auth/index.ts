import { getDatabase } from '../database'
import { OfflineAuthProvider } from './offline'
import { ElybyAuthProvider } from './elyby'
import type { AuthSession, LoginCredentials } from './types'

const providers = {
  offline: new OfflineAuthProvider(),
  elyby: new ElybyAuthProvider(),
}

export function getAuthProvider(name: string) {
  const provider = providers[name as keyof typeof providers]
  if (!provider) throw new Error(`Unknown auth provider: ${name}`)
  return provider
}

export async function login(provider: string, credentials: LoginCredentials): Promise<AuthSession> {
  const authProvider = getAuthProvider(provider)
  const session = await authProvider.login(credentials)
  return session
}

export function saveSession(session: AuthSession): void {
  const db = getDatabase()

  db.prepare('DELETE FROM auth_sessions').run()

  db.prepare(`
    INSERT INTO auth_sessions (provider, username, access_token, uuid, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    session.provider,
    session.username,
    session.accessToken || null,
    session.uuid || null,
    session.expiresAt || null,
    Date.now(),
  )
}

export function getSession(): AuthSession | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM auth_sessions ORDER BY created_at DESC LIMIT 1').get()

  if (!row) return null

  const session: AuthSession = {
    provider: row.provider,
    username: row.username,
    accessToken: row.access_token || undefined,
    uuid: row.uuid || undefined,
    expiresAt: row.expires_at || undefined,
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearSession()
    return null
  }

  return session
}

export function clearSession(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM auth_sessions').run()
}
