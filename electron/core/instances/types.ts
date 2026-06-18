export interface Instance {
  id: string
  name: string
  version: string
  loader: 'vanilla' | 'fabric'
  createdAt: number
  icon: string
  minMemory: number
  maxMemory: number
  javaArgs: string
  gameDir: string | null
  lastPlayed: number | null
}

export interface CreateInstanceData {
  name: string
  version: string
  loader: 'vanilla' | 'fabric'
  icon?: string
  minMemory?: number
  maxMemory?: number
  javaArgs?: string
}

export interface UpdateInstanceData {
  name?: string
  version?: string
  loader?: 'vanilla' | 'fabric'
  icon?: string
  minMemory?: number
  maxMemory?: number
  javaArgs?: string
  gameDir?: string | null
  lastPlayed?: number | null
}
