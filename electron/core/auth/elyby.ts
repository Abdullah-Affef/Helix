import type { AuthProvider, AuthSession, LoginCredentials } from './types'

const ELYBY_AUTH_URL = 'https://authserver.ely.by/auth/authenticate'
const ELYBY_PROFILE_URL = 'https://api.ely.by/users/current?lang=en'

export class ElybyAuthProvider implements AuthProvider {
  readonly name = 'elyby'

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password required for Ely.by authentication')
    }

    const response = await fetch(ELYBY_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        clientToken: crypto.randomUUID(),
        requestUser: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ely.by authentication failed: ${error}`)
    }

    const data = await response.json()

    const session: AuthSession = {
      provider: 'elyby',
      username: data.selectedProfile?.name || data.user?.username || credentials.username,
      uuid: data.selectedProfile?.id,
      accessToken: data.accessToken,
      expiresAt: data.availableProfiles ? Date.now() + 86400000 : undefined,
    }

    return session
  }
}

export function buildElybyYggdrasilAuth(authSession: AuthSession): Record<string, string> {
  return {
    'minecraft:profile/username': authSession.username,
    'minecraft:profile/id': authSession.uuid || '',
    'minecraft:profile/token': authSession.accessToken || '',
    'minecraft:auth/uuid': authSession.uuid || '',
    'minecraft:auth/access_token': authSession.accessToken || '',
    'minecraft:auth/session': authSession.accessToken || '',
  }
}
