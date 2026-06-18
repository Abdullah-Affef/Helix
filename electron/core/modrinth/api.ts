import fs from 'fs'
import path from 'path'

const MODRINTH_API = 'https://api.modrinth.com/v2'

export interface ModrinthSearchOptions {
  query: string
  facets?: string[][]
  limit?: number
  offset?: number
  index?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'
}

export interface ModrinthProject {
  slug: string
  title: string
  description: string
  categories: string[]
  client_side: 'required' | 'optional' | 'unsupported'
  server_side: 'required' | 'optional' | 'unsupported'
  project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader'
  downloads: number
  icon_url: string | null
  project_id: string
  versions: string[]
  latest_version: string | null
  date_created: string
  date_modified: string
}

export interface ModrinthVersion {
  id: string
  project_id: string
  author_id: string
  featured: boolean
  name: string
  version_number: string
  changelog: string
  date_published: string
  downloads: number
  version_type: 'release' | 'beta' | 'alpha'
  files: ModrinthFile[]
  dependencies: ModrinthDependency[]
  game_versions: string[]
  loaders: string[]
}

export interface ModrinthFile {
  hashes: {
    sha1: string
    sha512: string
  }
  url: string
  filename: string
  primary: boolean
  size: number
}

export interface ModrinthDependency {
  version_id: string | null
  project_id: string | null
  file_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
}

export interface ModrinthSearchResult {
  hits: ModrinthProject[]
  offset: number
  limit: number
  total_hits: number
}

export interface ModrinthCategory {
  icon: string
  name: string
  project_type: string
  header: string
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${MODRINTH_API}${endpoint}`
  const headers: Record<string, string> = {
    'User-Agent': 'helix-launcher/1.0.0 (contact@helix.dev)',
  }
  const method = options?.method || 'GET'
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!response.ok) {
    throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function searchProjects(
  query: string,
  opts: ModrinthSearchOptions = {},
): Promise<ModrinthSearchResult> {
  const params = new URLSearchParams()
  params.set('query', query || '')
  params.set('limit', String(opts.limit || 20))
  params.set('offset', String(opts.offset || 0))
  params.set('index', opts.index || 'relevance')

  if (opts.facets && opts.facets.length > 0) {
    params.set('facets', JSON.stringify(opts.facets))
  }

  return fetchApi<ModrinthSearchResult>(`/search?${params.toString()}`)
}

export async function getProject(id: string): Promise<ModrinthProject> {
  return fetchApi<ModrinthProject>(`/project/${id}`)
}

export async function getProjectVersions(
  projectId: string,
  gameVersions?: string[],
  loaders?: string[],
): Promise<ModrinthVersion[]> {
  // Try API-side filtering if filters are provided
  const hasFilters = (gameVersions && gameVersions.length > 0) || (loaders && loaders.length > 0)

  if (hasFilters) {
    try {
      const params = new URLSearchParams()
      if (gameVersions && gameVersions.length > 0) {
        gameVersions.forEach(v => params.append('game_versions', JSON.stringify([v])))
      }
      if (loaders && loaders.length > 0) {
        loaders.forEach(l => params.append('loaders', JSON.stringify([l])))
      }
      const qs = params.toString()
      const endpoint = `/project/${projectId}/version${qs ? '?' + qs : ''}`
      const result = await fetchApi<ModrinthVersion[]>(endpoint)
      if (result.length > 0) return result
    } catch {
      // fall through to unfiltered fetch
    }
  }

  // Fetch all versions (one attempt only — avoids double-fetch when no filters)
  try {
    const all = await fetchApi<ModrinthVersion[]>(`/project/${projectId}/version`)
    if (all.length === 0) return all
    let filtered = all
    if (gameVersions && gameVersions.length > 0) {
      filtered = filtered.filter(v =>
        gameVersions.some(gv =>
          v.game_versions.some(vgv =>
            vgv === gv || gv.startsWith(vgv + '.') || vgv.startsWith(gv + '.'),
          ),
        ),
      )
    }
    if (loaders && loaders.length > 0) {
      filtered = filtered.filter(v =>
        loaders.some(l => v.loaders.includes(l)),
      )
    }
    return filtered
  } catch {
    // Last resort: try /version/{id} endpoint directly
    try {
      const project = await fetchApi<ModrinthProject>(`/project/${projectId}`)
      if (project.latest_version) {
        const v = await fetchApi<ModrinthVersion>(`/version/${project.latest_version}`)
        if (v) return [v]
      }
      return []
    } catch {
      return []
    }
  }
}

export async function downloadMod(
  projectId: string,
  versionId: string,
  destDir: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<string> {
  let version: ModrinthVersion | null = null
  try {
    version = await fetchApi<ModrinthVersion>(`/version/${versionId}`)
  } catch {
    try {
      const versions = await fetchApi<ModrinthVersion[]>(`/project/${projectId}/version`)
      version = versions.find(v => v.id === versionId) || versions[0] || null
    } catch {
      // both failed
    }
  }
  if (!version) throw new Error(`No version found for project ${projectId}`)

  const primaryFile = version.files.find(f => f.primary) || version.files[0]
  if (!primaryFile) throw new Error(`No files found for version ${versionId}`)

  const destPath = path.join(destDir, primaryFile.filename)

  const response = await fetch(primaryFile.url)
  if (!response.ok) throw new Error(`Failed to download ${primaryFile.filename}`)

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body!.getReader()

  const chunks: Uint8Array[] = []
  let downloaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    downloaded += value.length
    if (total && onProgress) {
      onProgress(downloaded, total)
    }
  }

  const buffer = Buffer.concat(chunks)
  fs.writeFileSync(destPath, buffer)

  return destPath
}

