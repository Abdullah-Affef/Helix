export interface VersionManifest {
  latest: {
    release: string
    snapshot: string
  }
  versions: VersionManifestEntry[]
}

export interface VersionManifestEntry {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha'
  url: string
  time: string
  releaseTime: string
}

export interface VersionInfo {
  id: string
  type: string
  mainClass: string
  minecraftArguments?: string
  arguments?: {
    game?: any[]
    jvm?: any[]
  }
  assetIndex: {
    id: string
    url: string
    sha1: string
    size: number
    totalSize: number
  }
  downloads: {
    client: Artifact
    server?: Artifact
  }
  libraries: Library[]
  logging?: {
    client: {
      argument: string
      file: {
        id: string
        url: string
        sha1: string
        size: number
      }
      type: string
    }
  }
  inheritsFrom?: string
  jar?: string
}

export interface Artifact {
  url: string
  sha1: string
  size: number
  path?: string
}

export interface Library {
  name: string
  downloads?: {
    artifact?: Artifact
    classifiers?: Record<string, Artifact>
  }
  rules?: OsRule[]
  natives?: Record<string, string>
  extract?: {
    exclude: string[]
  }
  url?: string
}

export interface OsRule {
  action: 'allow' | 'disallow'
  os?: {
    name?: string
    version?: string
    arch?: string
  }
}

export interface FabricLoaderInfo {
  loader: {
    separator: string
    build: number
    maven: string
    version: string
    stable: boolean
  }
  intermediary: {
    maven: string
    version: string
  }
  launcherMeta: {
    libraries: Library[]
    mainClass: Record<string, string>
  }
}

export interface AssetIndex {
  objects: Record<string, {
    hash: string
    size: number
  }>
}
