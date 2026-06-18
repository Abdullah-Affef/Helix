import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: SqlJsDatabase | null = null
let dbInitialized = false

class StatementWrapper {
  private sql: string
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase, sql: string) {
    this.db = db
    this.sql = sql
  }

  run(...params: any[]): { changes: number } {
    try {
      this.db.run(this.sql, params)
      saveDatabase()
      return { changes: this.db.getRowsModified() }
    } catch (err) {
      return { changes: 0 }
    }
  }

  get(...params: any[]): any {
    const stmt = this.db.prepare(this.sql)
    if (params.length > 0) {
      stmt.bind(params)
    }
    if (stmt.step()) {
      const result = stmt.getAsObject()
      stmt.free()
      return result
    }
    stmt.free()
    return undefined
  }

  all(...params: any[]): any[] {
    const results: any[] = []
    const stmt = this.db.prepare(this.sql)
    if (params.length > 0) {
      stmt.bind(params)
    }
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return

  const dataDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'helix.db')

  const SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      loader TEXT NOT NULL DEFAULT 'vanilla',
      created_at INTEGER NOT NULL,
      icon TEXT DEFAULT 'default',
      min_memory INTEGER DEFAULT 2,
      max_memory INTEGER DEFAULT 4,
      java_args TEXT DEFAULT '',
      game_dir TEXT,
      last_played INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      username TEXT NOT NULL,
      access_token TEXT,
      uuid TEXT,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS installed_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      instance_id TEXT NOT NULL,
      project_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      installed_at INTEGER NOT NULL,
      FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
    )
  `)

  saveDatabase()
  dbInitialized = true
}

function saveDatabase() {
  if (!db) return
  const dataDir = path.join(app.getPath('userData'), 'data')
  const dbPath = path.join(dataDir, 'helix.db')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

export function getDatabase(): {
  prepare: (sql: string) => StatementWrapper
  exec: (sql: string) => void
  run: (sql: string, params?: any[]) => void
} {
  if (!db) throw new Error('Database not initialized')

  return {
    prepare: (sql: string) => new StatementWrapper(db!, sql),
    exec: (sql: string) => { db!.run(sql); saveDatabase() },
    run: (sql: string, params?: any[]) => { db!.run(sql, params || []); saveDatabase() },
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
    dbInitialized = false
  }
}
