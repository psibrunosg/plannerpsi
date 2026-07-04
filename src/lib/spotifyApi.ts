import { useSpotifyStore } from '@/stores/spotifyStore'
import { useToastStore } from '@/stores/toastStore'
import { refreshAccessToken } from '@/lib/spotifyAuth'

const API_BASE = 'https://api.spotify.com/v1'
const TOKEN_EXPIRY_BUFFER_MS = 60_000

let refreshInFlight: Promise<string | null> | null = null

async function ensureFreshToken(): Promise<string | null> {
  const { accessToken, expiresAt } = useSpotifyStore.getState()
  if (!accessToken) return null

  if (expiresAt && expiresAt - TOKEN_EXPIRY_BUFFER_MS > Date.now()) {
    return accessToken
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

export async function spotifyFetch<T = unknown>(path: string, init?: RequestInit): Promise<T | null> {
  const token = await ensureFreshToken()
  if (!token) return null

  const doFetch = (accessToken: string) => fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })

  let res = await doFetch(token)

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) return null
    res = await doFetch(newToken)
  }

  if (res.status === 204) return null

  if (res.status === 403) {
    useToastStore.getState().addToast('Requer Spotify Premium para controlar a reprodução.', 'error')
    return null
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') || '1')
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return spotifyFetch<T>(path, init)
  }

  if (!res.ok) {
    console.error('Spotify API error', res.status, await res.text().catch(() => ''))
    return null
  }

  const text = await res.text()
  if (!text) return null
  return JSON.parse(text) as T
}
