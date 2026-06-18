import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import { getLauncherDir } from '../settings'
import type { VersionManifest, VersionInfo, AssetIndex } from './types'

const MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'
const ASSETS_BASE_URL = 'https://resources.download.minecraft.net'

function getVersionsDir(): string {
  const dir = path.join(getLauncherDir(), 'versions')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getAssetsDir(): string {
  const dir = path.join(getLauncherDir(), 'assets')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getLibrariesDir(): string {
  const dir = path.join(getLauncherDir(), 'libraries')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getVersionDir(versionId: string): string {
  return path.join(getVersionsDir(), versionId)
}

export function getVersionJsonPath(versionId: string): string {
  return path.join(getVersionDir(versionId), `${versionId}.json`)
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

export async function downloadWithHashCheck(url: string, destPath: string, sha1?: string): Promise<void> {
  if (fs.existsSync(destPath)) {
    if (sha1) {
      const existingHash = crypto.createHash('sha1').update(fs.readFileSync(destPath)).digest('hex')
      if (existingHash === sha1) return
    } else {
      return
    }
  }

  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

export async function fetchVersionManifest(): Promise<VersionManifest> {
  const response = await fetch(MANIFEST_URL)
  if (!response.ok) throw new Error(`Failed to fetch version manifest: ${response.statusText}`)
  return response.json()
}

export async function getVersionInfo(versionId: string): Promise<VersionInfo> {
  const jsonPath = getVersionJsonPath(versionId)

  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  }

  const manifest = await fetchVersionManifest()
  const entry = manifest.versions.find(v => v.id === versionId)
  if (!entry) throw new Error(`Version ${versionId} not found in manifest`)

  const versionDir = getVersionDir(versionId)
  if (!fs.existsSync(versionDir)) fs.mkdirSync(versionDir, { recursive: true })

  await downloadFile(entry.url, jsonPath)

  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
}

async function downloadAssetIndex(versionInfo: VersionInfo): Promise<AssetIndex> {
  const assetsDir = getAssetsDir()
  const indexPath = path.join(assetsDir, 'indexes', `${versionInfo.assetIndex.id}.json`)

  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  }

  const indexDir = path.dirname(indexPath)
  if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, { recursive: true })

  await downloadWithHashCheck(versionInfo.assetIndex.url, indexPath, versionInfo.assetIndex.sha1)

  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
}

export async function downloadAssets(
  versionInfo: VersionInfo,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const assetIndex = await downloadAssetIndex(versionInfo)
  const assetsDir = getAssetsDir()
  const objectsDir = path.join(assetsDir, 'objects')

  const entries = Object.entries(assetIndex.objects) as [string, { hash: string; size: number }][]
  const total = entries.length
  let completed = 0

  for (const [, meta] of entries) {
    const subDir = meta.hash.substring(0, 2)
    const destPath = path.join(objectsDir, subDir, meta.hash)
    const url = `${ASSETS_BASE_URL}/${subDir}/${meta.hash}`

    await downloadWithHashCheck(url, destPath, meta.hash)
    completed++
    if (onProgress) onProgress(completed, total)
  }
}

export function normalizeLibraryPath(lib: any): string {
  const parts = lib.name.split(':')
  const group = parts[0].replace(/\./g, '/')
  const artifact = parts[1]
  const version = parts[2]

  let fileName = `${artifact}-${version}.jar`
  if (parts.length > 3 && parts[3]) {
    fileName = `${artifact}-${version}-${parts[3]}.jar`
  }

  return `${group}/${artifact}/${version}/${fileName}`
}

export async function downloadLibraries(versionInfo: VersionInfo): Promise<string[]> {
  const librariesDir = getLibrariesDir()
  const classpathEntries: string[] = []
  const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux'
  const osArch = process.arch === 'x64' ? '64' : process.arch === 'arm64' ? 'arm64' : process.arch

  for (const lib of versionInfo.libraries) {
    try {
      let native = false

      if (lib.rules) {
        const allowed = lib.rules.every(rule => {
          if (rule.action === 'allow') {
            if (!rule.os) return true
            if (rule.os.name && rule.os.name !== osName) return false
            if (rule.os.arch && rule.os.arch !== osArch) return false
            return true
          }
          if (rule.action === 'disallow') {
            if (!rule.os) return false
            if (rule.os.name && rule.os.name === osName) return false
            return true
          }
          return true
        })
        if (!allowed) continue
      }

      if (lib.natives) {
        native = true
        const nativeKey = lib.natives[osName]
        if (!nativeKey || !lib.downloads?.classifiers) continue

        const classifierKey = `${nativeKey}-${osArch}`
        const nativeArtifact = lib.downloads.classifiers[classifierKey] || lib.downloads.classifiers[nativeKey]
        if (!nativeArtifact) continue

        const libPath = normalizeLibraryPath(lib)
        const jarDir = path.join(librariesDir, path.dirname(libPath))
        if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })

        const jarPath = path.join(librariesDir, path.dirname(libPath), `${path.basename(libPath, '.jar')}-${classifierKey}.jar`)
        await downloadWithHashCheck(nativeArtifact.url, jarPath, nativeArtifact.sha1)
        classpathEntries.push(jarPath)

        if (lib.extract) {
          const extractDir = path.join(librariesDir, 'natives', versionInfo.id)
          if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true })
          extractJar(jarPath, extractDir, lib.extract.exclude)
        }
        continue
      }

      const artifact = lib.downloads?.artifact
      if (!artifact) {
        const libUrl = lib.url || 'https://libraries.minecraft.net'
        const libPath = normalizeLibraryPath(lib)
        const jarPath = path.join(librariesDir, libPath)
        const jarUrl = `${libUrl}/${libPath}`

        const jarDir = path.dirname(jarPath)
        if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })
        await downloadWithHashCheck(jarUrl, jarPath)
        classpathEntries.push(jarPath)
        continue
      }

      const libPath = normalizeLibraryPath(lib)
      const jarPath = path.join(librariesDir, libPath)
      const jarDir = path.dirname(jarPath)
      if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })

      await downloadWithHashCheck(artifact.url, jarPath, artifact.sha1)
      classpathEntries.push(jarPath)
    } catch (err) {
      console.warn(`Failed to download library ${lib.name}:`, err)
    }
  }

  return classpathEntries
}

function extractJar(jarPath: string, destDir: string, excludes: string[]): void {
  try {
    const zip = new AdmZip(jarPath)
    const entries = zip.getEntries()

    for (const entry of entries) {
      if (entry.isDirectory) continue
      if (excludes.some(ex => entry.entryName.startsWith(ex))) continue

      const targetPath = path.join(destDir, entry.entryName)
      const targetDir = path.dirname(targetPath)
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

      fs.writeFileSync(targetPath, entry.getData())
    }
  } catch {
    console.warn(`Failed to extract natives from ${jarPath}`)
  }
}

export async function downloadClientJar(versionInfo: VersionInfo): Promise<string> {
  const jarPath = path.join(getVersionDir(versionInfo.id), `${versionInfo.id}.jar`)

  if (fs.existsSync(jarPath)) return jarPath

  await downloadWithHashCheck(versionInfo.downloads.client.url, jarPath, versionInfo.downloads.client.sha1)

  return jarPath
}

export async function prepareVersion(
  versionId: string,
  onAssetsProgress?: (current: number, total: number) => void,
): Promise<{
  versionInfo: VersionInfo
  classpath: string[]
  jarPath: string
  nativesDir: string
}> {
  const versionInfo = await getVersionInfo(versionId)

  if (versionInfo.inheritsFrom) {
    const parentInfo = await getVersionInfo(versionInfo.inheritsFrom)
    const parentClasspath = await downloadLibraries(parentInfo)
    await downloadAssets(parentInfo, onAssetsProgress)
    const parentJar = await downloadClientJar(parentInfo)

    const classpath = await downloadLibraries(versionInfo)
    await downloadAssets(versionInfo, onAssetsProgress)
    const clientJar = await downloadClientJar(versionInfo)

    return {
      versionInfo,
      classpath: [...classpath, ...parentClasspath],
      jarPath: clientJar,
      nativesDir: path.join(getLauncherDir(), 'libraries', 'natives', versionInfo.id),
    }
  }

  const classpath = await downloadLibraries(versionInfo)
  await downloadAssets(versionInfo, onAssetsProgress)
  const jarPath = await downloadClientJar(versionInfo)

  return {
    versionInfo,
    classpath,
    jarPath,
    nativesDir: path.join(getLauncherDir(), 'libraries', 'natives', versionInfo.id),
  }
}
