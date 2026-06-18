import { v4 as uuidv4 } from 'uuid'
import type { AuthProvider, AuthSession, LoginCredentials } from './types'

export class OfflineAuthProvider implements AuthProvider {
  readonly name = 'offline'

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.username || credentials.username.trim().length === 0) {
      throw new Error('Username is required for offline authentication')
    }

    const username = credentials.username.trim()

    const session: AuthSession = {
      provider: 'offline',
      username,
      uuid: uuidv4(),
      accessToken: uuidv4(),
    }

    return session
  }
}
