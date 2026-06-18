import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import AdmZip from 'adm-zip'
import { getInstance, getInstancesDir, getInstancePath } from '../instances'

const MANIFEST_FILE = 'modrinth.index.json'

interface MrpackFile {
  path: string
  downloads: string[]
  hashes: Record<string, string>
  fileSize: number
}

interface MrpackIndex {
  formatVersion: number
  game: string
  versionId: string
  name: string
  summary?: string
  files: MrpackFile[]
  dependencies?: Record<string, string>
}

interface MrpackInstallResult {
  name: string
  version: string
  filesInstalled: number
  dependencies: Record<string, string>
}

export async function installMrpack(
  mrpackPath: string,
  instanceId: string,
  onProgress?: (current: number, total: number, fileName: string) => void,
): Promise<MrpackInstallResult> {
  const instance = getInstance(instanceId)
  if (!instance) throw new Error(`Instance ${instanceId} not found`)
  const instanceDir = instance.gameDir || getInstancePath(getInstancesDir(), instance.name)
  const zip = new AdmZip(mrpackPath)

  const indexEntry = zip.getEntry(MANIFEST_FILE)
  if (!indexEntry) {
    throw new Error('Invalid mrpack: missing modrinth.index.json')
  }

  const indexData: MrpackIndex = JSON.parse(indexEntry.getData().toString('utf-8'))

  if (indexData.formatVersion !== 1) {
    throw new Error(`Unsupported mrpack format version: ${indexData.formatVersion}`)
  }

  if (indexData.game !== 'minecraft') {
    throw new Error(`Not a Minecraft modpack: ${indexData.game}`)
  }

  let filesInstalled = 0
  const totalFiles = indexData.files.length

  for (let i = 0; i < totalFiles; i++) {
    const file = indexData.files[i]
    try {
      const targetPath = path.join(instanceDir, file.path.replace(/\\/g, '/'))
      const targetDir = path.dirname(targetPath)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      if (file.downloads && file.downloads.length > 0) {
        onProgress?.(i + 1, totalFiles, path.basename(file.path))

        const response = await fetch(file.downloads[0])
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer())

          if (file.hashes?.sha1) {
            const hash = crypto.createHash('sha1').update(buffer).digest('hex')
            if (hash !== file.hashes.sha1) {
              console.warn(`SHA1 mismatch for ${file.path}, skipping`)
              continue
            }
          }

          fs.writeFileSync(targetPath, buffer)
          filesInstalled++
        } else {
          console.warn(`Failed to download ${file.path}: ${response.statusText}`)
        }
      }
    } catch (err) {
      console.warn(`Failed to install ${file.path}:`, err)
    }
  }

  const overridesEntry = zip.getEntry('overrides/')
  if (overridesEntry && overridesEntry.isDirectory) {
    const entries = zip.getEntries()
    for (const entry of entries) {
      if (entry.entryName.startsWith('overrides/') && !entry.isDirectory) {
        const relativePath = entry.entryName.replace(/^overrides\//, '')
        const targetPath = path.join(instanceDir, relativePath)
        const targetDir = path.dirname(targetPath)
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        fs.writeFileSync(targetPath, entry.getData())
        filesInstalled++
      }
    }
  }

  return {
    name: indexData.name,
    version: indexData.versionId,
    filesInstalled,
    dependencies: indexData.dependencies || {},
  }
}

export async function installMrpackFromUrl(
  url: string,
  instanceId: string,
  onProgress?: (current: number, total: number, fileName: string) => void,
): Promise<MrpackInstallResult> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download mrpack: ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const tmpDir = path.join(os.tmpdir(), 'helix-mrpacks')
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  const tmpPath = path.join(tmpDir, `modpack-${Date.now()}.mrpack`)
  fs.writeFileSync(tmpPath, buffer)

  try {
    const result = await installMrpack(tmpPath, instanceId, onProgress)
    return result
  } finally {
    try { fs.unlinkSync(tmpPath) } catch {}
  }
}
