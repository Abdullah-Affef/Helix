export interface AuthSession {
  provider: 'offline' | 'elyby'
  username: string
  accessToken?: string
  uuid?: string
  expiresAt?: number
}

export interface LoginCredentials {
  username: string
  password?: string
}

export interface AuthProvider {
  name: string
  login(credentials: LoginCredentials): Promise<AuthSession>
}
