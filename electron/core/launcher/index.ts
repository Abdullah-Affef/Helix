import { BrowserWindow } from 'electron'
import path from 'path'
import { getInstance, getInstancesDir, getInstancePath } from '../instances'
import { getSession } from '../auth'
import { getLauncherDir } from '../settings'
import { prepareVersion, prepareFabricVersion } from '../versions'
import { findJava, ensureJava, launchJava, type LaunchContext } from './java'
import { getLatestFabricLoader } from '../versions/fabric'
import { downloadClientJar, downloadLibraries, downloadAssets } from '../versions/manifest'

const activeProcesses = new Map<string, any>()

export function getLaunchStatus(instanceId: string): { running: boolean; pid?: number } {
  const proc = activeProcesses.get(instanceId)
  if (!proc) return { running: false }
  return { running: true, pid: proc.pid }
}

function sendLog(msg: string) {
  BrowserWindow.getAllWindows()[0]?.webContents.send('console:log', msg)
}

export async function launchInstance(instanceId: string): Promise<void> {
  sendLog(`Launching instance ${instanceId}...`)
  const instance = getInstance(instanceId)
  if (!instance) throw new Error(`Instance ${instanceId} not found`)

  const session = getSession()
  if (!session) throw new Error('No authenticated session found. Please login first.')

  sendLog('Checking Java...')
  let javaInfo = findJava()
  if (!javaInfo) {
    sendLog('Java 21 not found, downloading...')
    const javaPath = await ensureJava((current, total) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', {
        label: 'Downloading Java 21',
        percent: Math.round((current / total) * 100),
        bytesDownloaded: current,
        bytesTotal: total,
      })
    })
    BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', null)
    sendLog('Java 21 ready')
    javaInfo = findJava()
  }
  if (!javaInfo) throw new Error('Failed to set up Java 21')
  sendLog(`Found Java at ${javaInfo.path}`)

  let versionName: string
  let classpath: string[]
  let jarPath: string
  let mainClass: string
  let nativesDir: string
  let versionInfo: any

  if (instance.loader === 'fabric') {
    sendLog('Fetching latest Fabric loader...')
    const loaderInfo = await getLatestFabricLoader(instance.version)
    if (!loaderInfo) throw new Error(`Fabric not available for Minecraft ${instance.version}`)
    const loaderVer = loaderInfo.loader.version
    sendLog(`Preparing Fabric ${loaderVer} for Minecraft ${instance.version}...`)
    const result = await prepareFabricVersion(instance.version, loaderVer)
    versionName = `fabric-${instance.version}-${loaderVer}`
    classpath = result.classpath
    jarPath = result.jarPath
    mainClass = result.mainClass
    nativesDir = result.nativesDir
    versionInfo = result.versionInfo

    sendLog('Downloading Minecraft libraries...')
    const vanillaLibs = await downloadLibraries(result.versionInfo)
    classpath.push(...vanillaLibs)

    sendLog('Downloading Minecraft client jar...')
    const clientJar = await downloadClientJar(result.versionInfo)
    classpath.push(clientJar)

    sendLog('Downloading game assets...')
    await downloadAssets(result.versionInfo, (current, total) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', {
        label: `Assets (${current}/${total})`,
        percent: Math.round((current / total) * 100),
        bytesDownloaded: current,
        bytesTotal: total,
      })
    })
    BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', null)
  } else {
    sendLog('Preparing vanilla version...')
    const result = await prepareVersion(instance.version, (current, total) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', {
        label: `Assets (${current}/${total})`,
        percent: Math.round((current / total) * 100),
        bytesDownloaded: current,
        bytesTotal: total,
      })
    })
    BrowserWindow.getAllWindows()[0]?.webContents.send('download:progress', null)
    versionName = instance.version
    classpath = result.classpath
    jarPath = result.jarPath
    mainClass = result.versionInfo.mainClass
    nativesDir = result.nativesDir
    versionInfo = result.versionInfo
  }

  const gameDir = instance.gameDir || getInstancePath(getInstancesDir(), instance.name)
  if (jarPath) {
    classpath.push(jarPath)
  }

  const assetIndex = path.join(
    getLauncherDir(),
    'assets',
    'indexes',
    `${versionInfo.assetIndex?.id || instance.version}.json`,
  )

  const ctx: LaunchContext = {
    javaPath: javaInfo.path,
    gameDir,
    versionName,
    classpath,
    mainClass,
    minMemory: instance.minMemory,
    maxMemory: instance.maxMemory,
    javaArgs: instance.javaArgs,
    nativesDir,
    assetIndex,
    accessToken: session.accessToken || '0',
    uuid: session.uuid || '0',
    username: session.username,
    versionType: instance.loader === 'fabric' ? 'fabric' : 'release',
  }

  const win = () => BrowserWindow.getAllWindows()[0]

  const proc = launchJava(
    ctx,
    (data) => {
      win()?.webContents.send('launcher:log', data)
    },
    (code) => {
      activeProcesses.delete(instanceId)
      win()?.webContents.send('launcher:exit', code)
    },
  )

  activeProcesses.set(instanceId, proc)
}
