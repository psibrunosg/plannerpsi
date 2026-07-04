import { useSpotifyStore } from '@/stores/spotifyStore'

const CLIENT_ID = 'cedd2bb34ac543e7b35e471f859a8e89'
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private'
const VERIFIER_KEY = 'spotify_pkce_verifier'
const STATE_KEY = 'spotify_auth_state'

function getRedirectUri(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function beginLogin(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = randomState()

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export async function handleCallbackIfPresent(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')

  if (!code && !error) return

  // Clean the URL immediately so a page refresh doesn't try to re-exchange the code
  const cleanUrl = `${window.location.pathname}#/settings`
  window.history.replaceState(null, '', cleanUrl)

  if (error) {
    console.error('Spotify auth error:', error)
    return
  }

  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)

  if (!code || !verifier || !state || state !== expectedState) {
    console.error('Spotify auth: state mismatch or missing verifier')
    return
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: CLIENT_ID,
    code_verifier: verifier,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    console.error('Spotify token exchange failed', await res.text())
    return
  }

  const data: TokenResponse = await res.json()
  useSpotifyStore.getState().setTokens(data.access_token, data.refresh_token ?? null, Date.now() + data.expires_in * 1000)
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useSpotifyStore.getState().refreshToken
  if (!refreshToken) return null

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    console.error('Spotify token refresh failed', await res.text())
    useSpotifyStore.getState().disconnect()
    return null
  }

  const data: TokenResponse = await res.json()
  // Spotify rotates the refresh token on PKCE flows — always persist it when returned
  useSpotifyStore.getState().setTokens(data.access_token, data.refresh_token ?? refreshToken, Date.now() + data.expires_in * 1000)
  return data.access_token
}
