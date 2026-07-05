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
  visibleGroups: string[]
  activeChannel: Channel | null
  isLoading: boolean
  error: string | null
  customUrls: string[]
  
  fetchPlaylists: (force?: boolean) => Promise<void>
  loadLocalPlaylists: (files: FileList) => Promise<void>
  setActiveChannel: (channel: Channel) => void
  addCustomUrl: (url: string) => void
  removeCustomUrl: (url: string) => void
  toggleGroupVisibility: (group: string, isVisible: boolean) => void
  setVisibleGroups: (groups: string[]) => void
}

async function parseM3uStream(stream: ReadableStream<Uint8Array>, sourceIndex: number): Promise<Channel[]> {
  const channels: Channel[] = []
  let currentChannel: Partial<Channel> = {}
  let channelIndex = 0
  let buffer = ''
  
  const decoder = new TextDecoder('utf-8')
  const reader = stream.getReader()

  let chunkCount = 0
  const MAX_CHANNELS_PER_LIST = 20000 // Prevent Out Of Memory crashes on huge VOD files

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    
    let newlineIndex
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.substring(0, newlineIndex).trim()
      buffer = buffer.substring(newlineIndex + 1)

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
          
          if (channels.length >= MAX_CHANNELS_PER_LIST) {
            reader.cancel()
            return channels
          }
        }
      }
    }

    // Yield to main thread every few chunks to keep UI responsive
    chunkCount++
    if (chunkCount % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  return channels
}

export const useIptvStore = create<IptvState>()(
  persist(
    (set, get) => ({
      channels: [],
      groups: [],
      visibleGroups: [],
      activeChannel: null,
      isLoading: false,
      error: null,
      customUrls: [],

      addCustomUrl: (url) => {
        set((state) => {
          if (!state.customUrls.includes(url)) {
            return { customUrls: [...state.customUrls, url] }
          }
          return state
        })
        get().fetchPlaylists(true)
      },

      removeCustomUrl: (url) => {
        set((state) => ({
          customUrls: state.customUrls.filter(u => u !== url)
        }))
        get().fetchPlaylists(true)
      },
      
      toggleGroupVisibility: (group: string, isVisible: boolean) => set((state) => {
        if (isVisible) {
          if (!state.visibleGroups.includes(group)) {
            return { visibleGroups: [...state.visibleGroups, group] }
          }
        } else {
          return { visibleGroups: state.visibleGroups.filter(g => g !== group) }
        }
        return state
      }),
      
      setVisibleGroups: (groups: string[]) => set({ visibleGroups: groups }),

      setActiveChannel: (channel) => set({ activeChannel: channel }),

      fetchPlaylists: async (force = false) => {
        if (!force && get().channels.length > 0) return
        
        const { customUrls } = get()
        if (customUrls.length === 0) {
           set({ channels: [], groups: [], isLoading: false, error: null })
           return
        }
        
        set({ isLoading: true, error: null })
        try {
          let allChannels: Channel[] = []
          
          // Expand well-known GitHub repo URLs to their raw files to support user input
          const expandedUrls: string[] = []
          for (const url of customUrls) {
            const cleanUrl = url.trim().replace(/\/$/, '')
            if (cleanUrl.toLowerCase() === 'https://github.com/ramys/iptv-brasil-2026') {
              expandedUrls.push(
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR03.m3u8',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR04.m3u8',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR05.m3u8',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR06.m3u8',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial01.m3u',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial02.m3u',
                'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Lista%20Mundial03.m3u'
              )
            } else {
              expandedUrls.push(url)
            }
          }
          
          const fetchPromises = expandedUrls.map(async (url, index) => {
            try {
              const response = await fetch(url)
              if (!response.ok) throw new Error(`HTTP error ${response.status}`)
              
              if (!response.body) return []
              return await parseM3uStream(response.body, index)
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

          const validFiles = Array.from(files).filter(f => f.name.endsWith('.m3u') || f.name.endsWith('.m3u8'))

          const fetchPromises = validFiles.map(async (file, index) => {
            try {
              const stream = file.stream()
              return await parseM3uStream(stream, 1000 + index)
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
      partialize: (state) => ({ customUrls: state.customUrls, visibleGroups: state.visibleGroups }),
    }
  )
)
