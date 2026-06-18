import { execSync, spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { getLauncherDir } from '../settings'

const JAVA_PATHS: Record<string, string[]> = {
  win32: [
    'java',
    'java.exe',
    `${process.env.JAVA_HOME}\\bin\\java.exe`,
    `${process.env.ProgramFiles}\\Java\\jre-*\\bin\\java.exe`,
    `${process.env['ProgramFiles(x86)']}\\Java\\jre-*\\bin\\java.exe`,
    `${process.env.LocalAppData}\\Packages\\Microsoft.4297127D64EC6_8wekyb3d8bbwe\\LocalCache\\Local\\jre\\bin\\java.exe`,
  ],
  darwin: [
    'java',
    '/usr/bin/java',
    '/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java',
    '/Library/Java/JavaVirtualMachines/**/Contents/Home/bin/java',
  ],
  linux: [
    'java',
    '/usr/bin/java',
    '/usr/lib/jvm/**/bin/java',
  ],
}

const JAVA_VERSION = 21

function getJavaDir(): string {
  const dir = path.join(getLauncherDir(), 'java')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getJavaPlatform(): string {
  switch (process.platform) {
    case 'win32': return 'windows'
    case 'darwin': return 'mac'
    case 'linux': return 'linux'
    default: return 'linux'
  }
}

function getJavaArch(): string {
  switch (process.arch) {
    case 'x64': return 'x64'
    case 'arm64': return 'aarch64'
    default: return 'x64'
  }
}

function getJavaUrl(): string {
  const os = getJavaPlatform()
  const arch = getJavaArch()
  return `https://api.adoptium.net/v3/binary/latest/${JAVA_VERSION}/ga/${os}/${arch}/jdk/hotspot/normal/adoptium`
}

function getJavaExecutable(): string {
  const javaDir = getJavaDir()
  const platform = process.platform
  if (platform === 'win32') {
    const entries = fs.readdirSync(javaDir).filter(e => e.toLowerCase().startsWith('jdk'))
    if (entries.length === 0) return ''
    return path.join(javaDir, entries[0], 'bin', 'java.exe')
  } else if (platform === 'darwin') {
    const entries = fs.readdirSync(javaDir).filter(e => e.toLowerCase().startsWith('jdk'))
    if (entries.length === 0) return ''
    return path.join(javaDir, entries[0], 'Contents', 'Home', 'bin', 'java')
  } else {
    const entries = fs.readdirSync(javaDir).filter(e => e.toLowerCase().startsWith('jdk'))
    if (entries.length === 0) return ''
    return path.join(javaDir, entries[0], 'bin', 'java')
  }
}

export async function downloadJava(onProgress?: (current: number, total: number) => void): Promise<string> {
  const javaDir = getJavaDir()
  const url = getJavaUrl()
  const ext = process.platform === 'win32' ? '.zip' : '.tar.gz'
  const archivePath = path.join(javaDir, `jdk${ext}`)

  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`Failed to download Java: ${response.status}`)

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body!.getReader()
  const writer = fs.createWriteStream(archivePath)
  let downloaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    writer.write(value)
    downloaded += value.length
    if (total && onProgress) {
      onProgress(downloaded, total)
    }
  }

  await new Promise<void>((resolve, reject) => {
    writer.end((err) => err ? reject(err) : resolve())
  })

  if (process.platform === 'win32') {
    const zip = new AdmZip(archivePath)
    zip.extractAllTo(javaDir, true)
  } else {
    execSync(`tar xzf "${archivePath}" -C "${javaDir}"`, { timeout: 120000 })
  }

  fs.unlinkSync(archivePath)

  const javaPath = getJavaExecutable()
  if (!javaPath || !fs.existsSync(javaPath)) {
    throw new Error('Java download completed but executable not found')
  }

  return javaPath
}

export function ensureJava(onProgress?: (current: number, total: number) => void): Promise<string> {
  const existing = getJavaExecutable()
  if (existing && fs.existsSync(existing)) {
    const info = testJava(existing)
    if (info && info.version >= JAVA_VERSION) return Promise.resolve(existing)
  }
  return downloadJava(onProgress)
}

export interface JavaInfo {
  path: string
  version: number
  architecture: string
}

function expandGlob(pattern: string): string[] {
  if (!pattern.includes('*')) return [pattern]

  const dir = path.dirname(pattern)
  const base = path.basename(pattern)

  if (!fs.existsSync(dir)) return []

  try {
    const entries = fs.readdirSync(dir)
    const regex = new RegExp('^' + base.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    return entries
      .filter(e => regex.test(e))
      .map(e => path.join(dir, e))
  } catch {
    return []
  }
}

function testJava(javaPath: string): JavaInfo | null {
  try {
    const output = execSync(`"${javaPath}" -version 2>&1`, { timeout: 5000 }).toString()
    const versionMatch = output.match(/(?:openjdk|java) version "(\d+)/i)
    if (!versionMatch) return null
    return {
      path: javaPath,
      version: parseInt(versionMatch[1]),
      architecture: process.arch,
    }
  } catch {
    return null
  }
}

export function findJava(): JavaInfo | null {
  // Check bundled Java first
  const bundled = getJavaExecutable()
  if (bundled) {
    const result = testJava(bundled)
    if (result && result.version >= JAVA_VERSION) return result
  }

  // Fall back to system paths
  const platform = process.platform as keyof typeof JAVA_PATHS
  const paths = JAVA_PATHS[platform] || JAVA_PATHS.linux

  for (const p of paths) {
    if (p.includes('*')) {
      const expanded = expandGlob(p)
      for (const ep of expanded) {
        const result = testJava(ep)
        if (result && result.version >= JAVA_VERSION) return result
      }
    } else {
      const result = testJava(p)
      if (result && result.version >= JAVA_VERSION) return result
    }
  }

  return null
}

export interface LaunchContext {
  javaPath: string
  gameDir: string
  versionName: string
  classpath: string[]
  mainClass: string
  minMemory: number
  maxMemory: number
  javaArgs: string
  nativesDir: string
  assetIndex: string
  accessToken: string
  uuid: string
  username: string
  versionType: string
}

export function buildJvmArgs(ctx: LaunchContext): string[] {
  const cp = ctx.classpath.join(';')
  const nativePath = ctx.nativesDir

  const args: string[] = [
    `-Xms${ctx.minMemory}G`,
    `-Xmx${ctx.maxMemory}G`,
  ]

  if (ctx.javaArgs) {
    args.push(...ctx.javaArgs.split(/\s+/).filter(Boolean))
  }

  args.push(
    `-Djava.library.path=${nativePath}`,
    `-Dminecraft.launcher.brand=helix-launcher`,
    `-Dminecraft.launcher.version=1.0.0`,
    `-cp`, cp,
    ctx.mainClass,
  )

  return args
}

export function buildMinecraftArgs(ctx: LaunchContext): string[] {
  const args: string[] = []

  const tokens: Record<string, string> = {
    '${auth_player_name}': ctx.username,
    '${version_name}': ctx.versionName,
    '${game_directory}': ctx.gameDir,
    '${assets_root}': path.join(path.dirname(ctx.assetIndex), '..'),
    '${assets_index_name}': path.basename(ctx.assetIndex, '.json'),
    '${auth_uuid}': ctx.uuid,
    '${auth_access_token}': ctx.accessToken,
    '${user_type}': 'mojang',
    '${version_type}': ctx.versionType,
    '${user_properties}': '{}',
    '${resolution_width}': '854',
    '${resolution_height}': '480',
  }

  args.push('--gameDir', ctx.gameDir)

  if (ctx.assetIndex) {
    args.push('--assetsDir', path.join(path.dirname(ctx.assetIndex), '..'))
    args.push('--assetIndex', path.basename(ctx.assetIndex, '.json'))
  }

  args.push('--uuid', ctx.uuid)
  args.push('--accessToken', ctx.accessToken)
  args.push('--userType', 'mojang')
  args.push('--version', ctx.versionName)
  args.push('--gameDir', ctx.gameDir)
  args.push('--username', ctx.username)

  return args
}

export function launchJava(
  ctx: LaunchContext,
  onLog?: (data: string) => void,
  onExit?: (code: number) => void,
): ChildProcess {
  const jvmArgs = buildJvmArgs(ctx)
  const mcArgs = buildMinecraftArgs(ctx)
  const allArgs = [...jvmArgs, ...mcArgs]

  const proc = spawn(ctx.javaPath, allArgs, {
    cwd: ctx.gameDir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  proc.unref()

  if (onLog && proc.stdout) {
    proc.stdout.on('data', (data: Buffer) => {
      onLog(data.toString())
    })
    proc.stderr?.on('data', (data: Buffer) => {
      onLog(data.toString())
    })
  }

  if (onExit) {
    proc.on('exit', (code) => {
      onExit(code ?? -1)
    })
    proc.on('error', (err) => {
      onExit(-1)
    })
  }

  return proc
}
