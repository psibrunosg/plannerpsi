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

// Fixed curated list of reliable focus/study radios
const CURATED_STATIONS: RadioStation[] = [
  {
    id: 'lofi-girl',
    name: 'Lofi Girl - beats to relax/study to',
    url: 'https://play.streamafrica.net/lofiradio',
    favicon: 'https://lofigirl.com/wp-content/uploads/2023/02/CROPPED-favicon-192x192.png',
    countrycode: 'FR',
    tags: 'lofi,focus,study,chill'
  },
  {
    id: 'chillhop',
    name: 'Chillhop Radio',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    favicon: 'https://chillhop.com/wp-content/uploads/2020/09/chillhop-icon.png',
    countrycode: 'NL',
    tags: 'lofi,chillhop,study'
  },
  {
    id: 'classical-mpr',
    name: 'Classical MPR (Minnesota Public Radio)',
    url: 'https://cms.stream.publicradio.org/cms.mp3',
    favicon: 'https://www.yourclassical.org/favicon.ico',
    countrycode: 'US',
    tags: 'classical,focus,study'
  },
  {
    id: 'jazz-groove',
    name: 'The Jazz Groove',
    url: 'https://audio-edge-12uht.fra.h.radiomast.io/871891a3-2313-4ff0-bf4a-0a4ffbe2b0ea',
    favicon: 'https://jazzgroove.org/favicon.ico',
    countrycode: 'US',
    tags: 'jazz,smooth,relax'
  },
  {
    id: 'ambient-sleeping-pill',
    name: 'Ambient Sleeping Pill',
    url: 'https://radio.stereoscenic.com/asp-s',
    favicon: 'https://ambientsleepingpill.com/favicon.ico',
    countrycode: 'US',
    tags: 'ambient,relax,focus'
  },
  {
    id: 'venice-classic',
    name: 'Venice Classic Radio Italia',
    url: 'https://uk1.streamingpulse.com/ssl/vcr1',
    favicon: 'https://www.veniceclassicradio.eu/images/vcr-logo.png',
    countrycode: 'IT',
    tags: 'classical,venice,italy,focus'
  },
  {
    id: 'classic-fm',
    name: 'Classic FM (UK)',
    url: 'https://media-ssl.musicradio.com/ClassicFM',
    favicon: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Classic_FM_logo.svg/1200px-Classic_FM_logo.svg.png',
    countrycode: 'UK',
    tags: 'classical,uk,focus'
  },
  {
    id: 'kusc-classical',
    name: 'KUSC Classical (Los Angeles)',
    url: 'https://stream.kusc.org/128k',
    favicon: 'https://www.kusc.org/wp-content/uploads/2016/12/KUSC-Logo.png',
    countrycode: 'US',
    tags: 'classical,symphony,focus'
  },
  {
    id: 'bossanova',
    name: 'Bossa Nova Hits',
    url: 'https://stream.zeno.fm/y13x1bntm5zuv',
    favicon: 'https://i.scdn.co/image/ab67706f00000003058cbfa898499de7256598c0',
    countrycode: 'BR',
    tags: 'bossa,brasil,relax'
  }
]

interface RadioState {
  isPlaying: boolean
  volume: number
  currentStation: RadioStation | null
  stations: RadioStation[]
  favorites: RadioStation[]
  isLoading: boolean
  
  // Actions
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentStation: (station: RadioStation) => void
  toggleFavorite: (station: RadioStation) => Promise<void>
  loadFavoritesFromDB: () => Promise<void>
  initStations: () => void
}

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      volume: 0.5,
      currentStation: null,
      stations: CURATED_STATIONS,
      favorites: [],
      isLoading: false,

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setCurrentStation: (station) => set({ currentStation: station, isPlaying: true }),
      
      initStations: () => {
        // Just sets the curated stations
        set({ stations: CURATED_STATIONS })
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
    }),
    {
      name: 'plannerpsi-radio-storage',
      partialize: (state) => ({ 
        volume: state.volume, 
        currentStation: state.currentStation,
        // We still persist favorites locally for faster load, but DB is source of truth on cross-device
        favorites: state.favorites
      }),
    }
  )
)
