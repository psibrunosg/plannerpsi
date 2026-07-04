import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { spotifyFetch } from '@/lib/spotifyApi'

export interface SpotifyPlaybackState {
  isPlaying: boolean
  trackName: string
  artists: string
  albumImageUrl: string | null
  deviceName: string | null
  progressMs: number
  durationMs: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  imageUrl: string | null
  uri: string
}

interface SpotifyState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  playbackState: SpotifyPlaybackState | null
  playlists: SpotifyPlaylist[]
  isLoading: boolean

  isConnected: () => boolean
  setTokens: (accessToken: string, refreshToken: string | null, expiresAt: number) => void
  disconnect: () => void
  fetchPlayback: () => Promise<void>
  play: (contextUri?: string) => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  fetchPlaylists: () => Promise<void>
}

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      playbackState: null,
      playlists: [],
      isLoading: false,

      isConnected: () => !!get().refreshToken,

      setTokens: (accessToken, refreshToken, expiresAt) => set((s) => ({
        accessToken,
        refreshToken: refreshToken ?? s.refreshToken,
        expiresAt,
      })),

      disconnect: () => set({ accessToken: null, refreshToken: null, expiresAt: null, playbackState: null, playlists: [] }),

      fetchPlayback: async () => {
        const data = await spotifyFetch<any>('/me/player')
        if (!data) {
          set({ playbackState: null })
          return
        }
        set({
          playbackState: {
            isPlaying: !!data.is_playing,
            trackName: data.item?.name ?? '',
            artists: (data.item?.artists ?? []).map((a: any) => a.name).join(', '),
            albumImageUrl: data.item?.album?.images?.[0]?.url ?? null,
            deviceName: data.device?.name ?? null,
            progressMs: data.progress_ms ?? 0,
            durationMs: data.item?.duration_ms ?? 0,
          }
        })
      },

      play: async (contextUri) => {
        await spotifyFetch('/me/player/play', {
          method: 'PUT',
          body: contextUri ? JSON.stringify({ context_uri: contextUri }) : undefined,
        })
        await get().fetchPlayback()
      },

      pause: async () => {
        await spotifyFetch('/me/player/pause', { method: 'PUT' })
        await get().fetchPlayback()
      },

      next: async () => {
        await spotifyFetch('/me/player/next', { method: 'POST' })
        await get().fetchPlayback()
      },

      previous: async () => {
        await spotifyFetch('/me/player/previous', { method: 'POST' })
        await get().fetchPlayback()
      },

      fetchPlaylists: async () => {
        set({ isLoading: true })
        const data = await spotifyFetch<any>('/me/playlists?limit=50')
        const playlists: SpotifyPlaylist[] = (data?.items ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.images?.[0]?.url ?? null,
          uri: p.uri,
        }))
        set({ playlists, isLoading: false })
      },
    }),
    {
      name: 'plannerpsi-spotify-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    }
  )
)
