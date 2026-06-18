import { searchProjects, getProject, getProjectVersions, downloadMod } from './api'
import { getDatabase } from '../database'
import { getInstance, getInstancesDir, getInstancePath } from '../instances'
import path from 'path'
import fs from 'fs'

export type { ModrinthProject, ModrinthVersion, ModrinthSearchResult, ModrinthSearchOptions } from './api'

export async function search(query: string, opts: any) {
  return searchProjects(query, opts)
}

export async function getProjectInfo(id: string) {
  return getProject(id)
}

export async function getVersions(projectId: string, opts: any) {
  return getProjectVersions(projectId, opts.gameVersions, opts.loaders)
}

export async function installProject(
  projectId: string,
  versionId: string,
  instanceId: string,
  projectType?: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<string> {
  const instance = getInstance(instanceId)
  if (!instance) throw new Error(`Instance ${instanceId} not found`)

  const instanceDir = instance.gameDir || getInstancePath(getInstancesDir(), instance.name)

  let targetDir: string
  if (projectType === 'resourcepack') {
    targetDir = path.join(instanceDir, 'resourcepacks')
  } else if (projectType === 'shader') {
    targetDir = path.join(instanceDir, 'shaderpacks')
  } else {
    targetDir = path.join(instanceDir, 'mods')
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const filePath = await downloadMod(projectId, versionId, targetDir, onProgress)

  const db = getDatabase()
  try {
    const versions = await getProjectVersions(projectId)
    const version = versions.find(v => v.id === versionId) || versions[0]
    if (version) {
      db.prepare(`
        INSERT INTO installed_projects (project_id, version_id, instance_id, project_type, file_name, installed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        versionId,
        instanceId,
        projectType || 'mod',
        path.basename(filePath),
        Date.now(),
      )
    }
  } catch {
    // DB insert is non-critical
  }

  return filePath
}

export async function getInstalledProjects(instanceId: string) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM installed_projects WHERE instance_id = ?').all(instanceId)
}
