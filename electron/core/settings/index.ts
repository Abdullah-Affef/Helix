import { app } from 'electron'
import { getDatabase } from '../database'

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getLauncherDir(): string {
  const saved = getSetting('launcherDir')
  if (saved) return saved
  return app.getPath('userData')
}

export function isSetupCompleted(): boolean {
  return getSetting('setupCompleted') === 'true'
}

export function markSetupCompleted(): void {
  setSetting('setupCompleted', 'true')
}
