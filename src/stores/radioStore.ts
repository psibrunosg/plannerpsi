import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export interface RadioStation {
  id: string
  name: string
  url: string
  favicon: string
  countrycode: string
  tags: string
}

// Curated stations are loaded dynamically from src/data/radios.json

// Radio Browser API mirrors — tried in order, remembering the last one that worked
const API_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
]
let preferredMirror = 0

const SEARCH_CACHE_TTL = 10 * 60 * 1000
const searchCache = new Map<string, { results: RadioStation[]; ts: number }>()

async function fetchFromRadioBrowser(path: string): Promise<any> {
  let lastError: unknown = null
  for (let i = 0; i < API_MIRRORS.length; i++) {
    const idx = (preferredMirror + i) % API_MIRRORS.length
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${API_MIRRORS[idx]}${path}`, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      preferredMirror = idx
      return data
    } catch (err) {
      lastError = err
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

interface RadioState {
  isPlaying: boolean
  volume: number
  currentStation: RadioStation | null
  stations: RadioStation[]
  favorites: RadioStation[]
  recentStations: RadioStation[]
  isLoading: boolean
  
  // Actions
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentStation: (station: RadioStation) => void
  toggleFavorite: (station: RadioStation) => Promise<void>
  loadFavoritesFromDB: () => Promise<void>
  initStations: () => Promise<void>
  searchStations: (query: string) => Promise<void>
}

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      volume: 0.5,
      currentStation: null,
      stations: [],
      favorites: [],
      recentStations: [],
      isLoading: false,

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setCurrentStation: (station) => {
        const { recentStations } = get()
        // Remove duplicates and keep only the latest 5
        const newRecent = [station, ...recentStations.filter(s => s.id !== station.id)].slice(0, 5)
        set({ currentStation: station, isPlaying: true, recentStations: newRecent })
      },
      
      initStations: async () => {
        const { stations } = get()
        if (stations.length === 0) {
          const data = await import('@/data/radios.json')
          set({ stations: data.default as RadioStation[] })
        }
      },

      loadFavoritesFromDB: async () => {
        const user = useAuthStore.getState().user
        if (!user) return

        const { data, error } = await supabase
          .from('user_preferences')
          .select('favorite_radios')
          .eq('user_id', user.id)
          .single()

        if (!error && data?.favorite_radios) {
          set({ favorites: data.favorite_radios as RadioStation[] })
        }
      },

      toggleFavorite: async (station) => {
        const { favorites } = get()
        const exists = favorites.find(f => f.id === station.id)
        let newFavorites = []
        
        if (exists) {
          newFavorites = favorites.filter(f => f.id !== station.id)
        } else {
          newFavorites = [...favorites, station]
        }
        
        set({ favorites: newFavorites })

        // Sync to Supabase
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({ 
              user_id: user.id, 
              favorite_radios: newFavorites,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
          
          if (error) console.error('Error syncing favorite radios:', error)
        }
      },

      searchStations: async (query) => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) {
          const data = await import('@/data/radios.json')
          set({ stations: data.default as RadioStation[] })
          return
        }

        const cached = searchCache.get(normalized)
        if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL) {
          set({ stations: cached.results })
          return
        }

        set({ isLoading: true })
        try {
          // Removes countrycode limits so it searches anywhere in the world
          const data = await fetchFromRadioBrowser(`/json/stations/search?name=${encodeURIComponent(normalized)}&limit=15&hidebroken=true&order=clickcount&reverse=true`)

          const results: RadioStation[] = data.map((s: any) => ({
            id: s.stationuuid,
            name: s.name,
            url: s.url_resolved || s.url,
            favicon: s.favicon,
            countrycode: s.countrycode,
            tags: s.tags
          }))

          searchCache.set(normalized, { results, ts: Date.now() })
          set({ stations: results.length > 0 ? results : [] })
        } catch (error) {
          console.error('Failed to search stations:', error)
          const { useToastStore } = await import('@/stores/toastStore')
          useToastStore.getState().addToast('Busca de rádios indisponível no momento', 'error')
          const data = await import('@/data/radios.json')
          set({ stations: data.default as RadioStation[] })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'plannerpsi-radio-storage',
      partialize: (state) => ({ 
        volume: state.volume, 
        currentStation: state.currentStation,
        // We still persist favorites locally for faster load, but DB is source of truth on cross-device
        favorites: state.favorites,
        recentStations: state.recentStations
      }),
    }
  )
)
