import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RadioStation {
  id: string
  name: string
  url: string
  favicon: string
  countrycode: string
  tags: string
}

interface RadioState {
  isPlaying: boolean
  volume: number
  currentStation: RadioStation | null
  stations: RadioStation[]
  selectedCountry: string
  isLoading: boolean
  
  // Actions
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentStation: (station: RadioStation) => void
  setSelectedCountry: (country: string) => void
  searchStations: (query: string, country?: string) => Promise<void>
}

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      volume: 0.5,
      currentStation: null,
      stations: [],
      selectedCountry: 'BR', // Default: Brazil
      isLoading: false,

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setCurrentStation: (station) => set({ currentStation: station, isPlaying: true }),
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      
      searchStations: async (query: string, country?: string) => {
        set({ isLoading: true })
        try {
          const searchCountry = country || get().selectedCountry
          // Fetch from Radio Browser API
          // Using a reliable node: de1.api.radio-browser.info
          const apiUrl = `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(query)}&countrycode=${searchCountry}&limit=30&hidebroken=true&order=clickcount&reverse=true`
          
          const response = await fetch(apiUrl)
          const data = await response.json()
          
          const mappedStations: RadioStation[] = data.map((s: any) => ({
            id: s.stationuuid,
            name: s.name,
            url: s.url_resolved || s.url,
            favicon: s.favicon,
            countrycode: s.countrycode,
            tags: s.tags
          }))
          
          set({ stations: mappedStations })
        } catch (error) {
          console.error("Failed to fetch radio stations", error)
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
        selectedCountry: state.selectedCountry
      }), // only persist volume, country, and current station
    }
  )
)
