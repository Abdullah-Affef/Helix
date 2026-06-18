import path from 'path'
import fs from 'fs'
import { getLauncherDir } from '../settings'
import { normalizeLibraryPath, downloadWithHashCheck, getVersionInfo } from './manifest'
import type { FabricLoaderInfo, VersionInfo, Library } from './types'

const FABRIC_META_URL = 'https://meta.fabricmc.net/v2'

async function downloadFile(url: string, destPath: string): Promise<void> {
  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

export async function getFabricLoaderVersions(mcVersion: string): Promise<FabricLoaderInfo[]> {
  const response = await fetch(`${FABRIC_META_URL}/versions/loader/${mcVersion}`)
  if (!response.ok) {
    if (response.status === 404) return []
    throw new Error(`Failed to fetch Fabric versions: ${response.statusText}`)
  }
  return response.json()
}

export async function getLatestFabricLoader(mcVersion: string): Promise<FabricLoaderInfo | null> {
  const versions = await getFabricLoaderVersions(mcVersion)
  if (versions.length === 0) return null

  const stable = versions.find(v => v.loader.stable)
  return stable || versions[0]
}

export async function getFabricProfileJson(
  mcVersion: string,
  loaderVersion: string,
): Promise<any> {
  const url = `${FABRIC_META_URL}/versions/loader/${mcVersion}/${loaderVersion}/profile/json`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch Fabric profile: ${response.statusText}`)
  return response.json()
}

function getFabricDir(): string {
  const dir = path.join(getLauncherDir(), 'fabric')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function downloadFabricLibrary(lib: Library): Promise<string> {
  const librariesDir = path.join(getLauncherDir(), 'libraries')

  if (!lib.url && !lib.downloads?.artifact) {
    const mavenUrl = 'https://maven.fabricmc.net'
    const libPath = normalizeLibraryPath(lib)
    const jarPath = path.join(librariesDir, libPath)
    const jarUrl = `${mavenUrl}/${libPath}`

    const jarDir = path.dirname(jarPath)
    if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })

    await downloadWithHashCheck(jarUrl, jarPath)
    return jarPath
  }

  if (lib.downloads?.artifact) {
    const artifact = lib.downloads.artifact
    const libPath = artifact.path || normalizeLibraryPath(lib)
    const jarPath = path.join(librariesDir, libPath)
    const jarDir = path.dirname(jarPath)
    if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })

    await downloadWithHashCheck(artifact.url, jarPath, artifact.sha1)
    return jarPath
  }

  const libPath = normalizeLibraryPath(lib)
  const jarPath = path.join(librariesDir, libPath)
  const jarUrl = `${lib.url}/${libPath}`

  const jarDir = path.dirname(jarPath)
  if (!fs.existsSync(jarDir)) fs.mkdirSync(jarDir, { recursive: true })

  await downloadWithHashCheck(jarUrl, jarPath)
  return jarPath
}

export async function prepareFabricVersion(
  mcVersion: string,
  loaderVersion: string,
): Promise<{
  versionInfo: VersionInfo
  classpath: string[]
  jarPath: string
  mainClass: string
  nativesDir: string
}> {
  const [vanillaInfo, fabricProfile] = await Promise.all([
    getVersionInfo(mcVersion),
    getFabricProfileJson(mcVersion, loaderVersion),
  ])

  const fabricLibraries = fabricProfile.libraries || []
  const fabricMainClass = fabricProfile.mainClass?.['client'] || 'net.fabricmc.loader.impl.launch.knot.KnotClient'

  const fabricClasspath: string[] = []
  for (const lib of fabricLibraries) {
    const jarPath = await downloadFabricLibrary(lib)
    fabricClasspath.push(jarPath)
  }

  const fabricDir = getFabricDir()
  const fabricJsonPath = path.join(fabricDir, `${mcVersion}-${loaderVersion}.json`)
  if (!fs.existsSync(fabricDir)) fs.mkdirSync(fabricDir, { recursive: true })
  fs.writeFileSync(fabricJsonPath, JSON.stringify(fabricProfile, null, 2))

  const fabricJarPath = path.join(fabricDir, `fabric-server-${mcVersion}-${loaderVersion}.launch.jar`)
  const fabricServerJar = fabricLibraries.find((l: Library) =>
    l.name.includes('fabric-loader') && l.name.includes('launch')
  )
  if (fabricServerJar?.downloads?.artifact) {
    await downloadWithHashCheck(
      fabricServerJar.downloads.artifact.url,
      fabricJarPath,
      fabricServerJar.downloads.artifact.sha1,
    )
  }

  return {
    versionInfo: vanillaInfo,
    classpath: fabricClasspath,
    jarPath: fabricJarPath,
    mainClass: fabricMainClass,
    nativesDir: path.join(getLauncherDir(), 'libraries', 'natives', `fabric-${mcVersion}`),
  }
}
