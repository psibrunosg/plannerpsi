import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Channel {
  id: string
  name: string
  url: string
  group: string
  logo: string
}

interface IptvState {
  channels: Channel[]
  groups: string[]
  activeChannel: Channel | null
  isLoading: boolean
  error: string | null
  customUrls: string[]
  
  fetchPlaylists: (force?: boolean) => Promise<void>
  loadLocalPlaylists: (files: FileList) => Promise<void>
  setActiveChannel: (channel: Channel) => void
  addCustomUrl: (url: string) => void
  removeCustomUrl: (url: string) => void
}

const PLAYLIST_URLS = [
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR03.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR04.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR05.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR06.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial01.m3u',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial02.m3u',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial03.m3u'
]

function parseM3u(content: string, sourceIndex: number): Channel[] {
  const channels: Channel[] = []
  let currentChannel: Partial<Channel> = {}
  let channelIndex = 0

  let startIndex = 0
  while (startIndex < content.length) {
    let endIndex = content.indexOf('\n', startIndex)
    if (endIndex === -1) endIndex = content.length
    
    let line = content.substring(startIndex, endIndex).trim()
    startIndex = endIndex + 1

    if (!line) continue

    if (line.startsWith('#EXTINF:')) {
      let name = 'Desconhecido'
      let group = 'Geral'
      let logo = ''

      const commaIndex = line.lastIndexOf(',')
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim()
      }

      const groupIndex = line.indexOf('group-title="')
      if (groupIndex !== -1) {
        const groupStart = groupIndex + 13
        const groupEnd = line.indexOf('"', groupStart)
        if (groupEnd !== -1) {
          group = line.substring(groupStart, groupEnd).trim()
        }
      }

      const logoIndex = line.indexOf('tvg-logo="')
      if (logoIndex !== -1) {
        const logoStart = logoIndex + 10
        const logoEnd = line.indexOf('"', logoStart)
        if (logoEnd !== -1) {
          logo = line.substring(logoStart, logoEnd).trim()
        }
      }

      currentChannel = { name, group, logo }
    } else if (!line.startsWith('#')) {
      if (currentChannel.name) {
        currentChannel.url = line
        currentChannel.id = `ch-${sourceIndex}-${channelIndex++}`
        channels.push(currentChannel as Channel)
        currentChannel = {}
      }
    }
  }
  return channels
}

export const useIptvStore = create<IptvState>()(
  persist(
    (set, get) => ({
      channels: [],
      groups: [],
      activeChannel: null,
      isLoading: false,
      error: null,
      customUrls: [],

      addCustomUrl: (url) => set((state) => {
        if (!state.customUrls.includes(url)) {
          return { customUrls: [...state.customUrls, url] }
        }
        return state
      }),

      removeCustomUrl: (url) => set((state) => ({
        customUrls: state.customUrls.filter(u => u !== url)
      })),

      setActiveChannel: (channel) => set({ activeChannel: channel }),

      fetchPlaylists: async (force = false) => {
        if (!force && get().channels.length > 0) return
        
        set({ isLoading: true, error: null })
        try {
          let allChannels: Channel[] = []
          const { customUrls } = get()
          const urlsToFetch = [...PLAYLIST_URLS, ...customUrls]
          
          const fetchPromises = urlsToFetch.map(async (url, index) => {
            try {
              const response = await fetch(url)
              if (!response.ok) throw new Error(`HTTP error ${response.status}`)
              
              const reader = response.body?.getReader()
              if (!reader) {
                const content = await response.text()
                return parseM3u(content, index)
              }

              let content = ''
              let receivedLength = 0
              const MAX_BYTES = 1024 * 1024 * 2 // 2MB limit per file

              const decoder = new TextDecoder('utf-8')
              
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                
                content += decoder.decode(value, { stream: true })
                receivedLength += value.length
                
                if (receivedLength >= MAX_BYTES) {
                  // Finalize decoding
                  content += decoder.decode()
                  reader.cancel()
                  break
                }
              }

              return parseM3u(content, index)
            } catch (e) {
              console.error('Failed to fetch playlist', url, e)
              return []
            }
          })

          const results = await Promise.all(fetchPromises)
          allChannels = results.flat()

          const groupsSet = new Set<string>()
          allChannels.forEach(c => {
            if (c.group) groupsSet.add(c.group)
          })
          
          const groups = Array.from(groupsSet).sort()

          set({ 
            channels: allChannels, 
            groups, 
            isLoading: false 
          })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      loadLocalPlaylists: async (files: FileList) => {
        set({ isLoading: true, error: null })
        try {
          const { channels: existingChannels } = get()
          let newChannels: Channel[] = []

          // Filter only m3u/m3u8 files
          const validFiles = Array.from(files).filter(f => f.name.endsWith('.m3u') || f.name.endsWith('.m3u8'))

          const fetchPromises = validFiles.map(async (file, index) => {
            try {
              const content = await file.text()
              return parseM3u(content, 1000 + index) // Offset index to avoid collision
            } catch (e) {
              console.error('Failed to read local file', file.name, e)
              return []
            }
          })

          const results = await Promise.all(fetchPromises)
          newChannels = results.flat()

          const allChannels = [...existingChannels, ...newChannels]
          
          const groupsSet = new Set<string>()
          allChannels.forEach(c => {
            if (c.group) groupsSet.add(c.group)
          })
          
          const groups = Array.from(groupsSet).sort()

          set({ 
            channels: allChannels, 
            groups, 
            isLoading: false 
          })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      }
    }),
    {
      name: 'iptv-storage',
      partialize: (state) => ({ customUrls: state.customUrls }),
    }
  )
)
