import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getDatabase } from '../database'
import { getSetting } from '../settings'
import type { Instance, CreateInstanceData, UpdateInstanceData } from './types'

function sanitizeName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'instance'
}

function rowToInstance(row: any): Instance {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    loader: row.loader,
    createdAt: row.created_at,
    icon: row.icon,
    minMemory: row.min_memory,
    maxMemory: row.max_memory,
    javaArgs: row.java_args || '',
    gameDir: row.game_dir || null,
    lastPlayed: row.last_played || null,
  }
}

export function getInstancesDir(): string {
  const savedDir = getSetting('instancesDir')
  if (savedDir && fs.existsSync(savedDir)) return savedDir
  const dir = path.join(app.getPath('userData'), 'instances')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getInstancePath(baseDir: string, name: string): string {
  return path.join(baseDir, sanitizeName(name))
}

export function ensureInstanceDir(baseDir: string, name: string): string {
  const dir = getInstancePath(baseDir, name)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    fs.mkdirSync(path.join(dir, 'mods'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'resourcepacks'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'shaderpacks'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'saves'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'logs'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'config'), { recursive: true })
  }
  return dir
}

export function listInstances(): Instance[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM instances ORDER BY last_played DESC, created_at DESC').all()
  return rows.map(rowToInstance)
}

export function getInstance(id: string): Instance | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM instances WHERE id = ?').get(id)
  return row ? rowToInstance(row) : null
}

export function createInstance(data: CreateInstanceData): Instance {
  const db = getDatabase()
  const id = uuidv4()
  const now = Date.now()

  const baseDir = getInstancesDir()
  const gameDir = ensureInstanceDir(baseDir, data.name)

  db.prepare(`
    INSERT INTO instances (id, name, version, loader, created_at, icon, min_memory, max_memory, java_args, game_dir)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.version,
    data.loader,
    now,
    data.icon || 'default',
    data.minMemory ?? 2,
    data.maxMemory ?? 4,
    data.javaArgs || '',
    gameDir,
  )

  return getInstance(id)!
}

export function updateInstance(id: string, data: UpdateInstanceData): Instance {
  const db = getDatabase()
  const existing = getInstance(id)
  if (!existing) throw new Error(`Instance ${id} not found`)

  const sets: string[] = []
  const params: any[] = []

  if (data.name !== undefined) {
    sets.push('name = ?')
    params.push(data.name)
    if (data.name !== existing.name && existing.gameDir && fs.existsSync(existing.gameDir)) {
      const baseDir = path.dirname(existing.gameDir)
      const newDir = getInstancePath(baseDir, data.name)
      if (existing.gameDir !== newDir && !fs.existsSync(newDir)) {
        fs.renameSync(existing.gameDir, newDir)
        if (data.gameDir === undefined) {
          sets.push('game_dir = ?')
          params.push(newDir)
        }
      }
    }
  }
  if (data.version !== undefined) { sets.push('version = ?'); params.push(data.version) }
  if (data.loader !== undefined) { sets.push('loader = ?'); params.push(data.loader) }
  if (data.icon !== undefined) { sets.push('icon = ?'); params.push(data.icon) }
  if (data.minMemory !== undefined) { sets.push('min_memory = ?'); params.push(data.minMemory) }
  if (data.maxMemory !== undefined) { sets.push('max_memory = ?'); params.push(data.maxMemory) }
  if (data.javaArgs !== undefined) { sets.push('java_args = ?'); params.push(data.javaArgs) }
  if (data.gameDir !== undefined) { sets.push('game_dir = ?'); params.push(data.gameDir) }
  if (data.lastPlayed !== undefined) { sets.push('last_played = ?'); params.push(data.lastPlayed) }

  if (sets.length > 0) {
    params.push(id)
    db.prepare(`UPDATE instances SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  }

  return getInstance(id)!
}

export function deleteInstance(id: string): void {
  const db = getDatabase()
  const instance = getInstance(id)

  db.prepare('DELETE FROM instances WHERE id = ?').run(id)
  db.prepare('DELETE FROM installed_projects WHERE instance_id = ?').run(id)

  if (instance?.gameDir && fs.existsSync(instance.gameDir)) {
    fs.rmSync(instance.gameDir, { recursive: true, force: true })
  }
}
