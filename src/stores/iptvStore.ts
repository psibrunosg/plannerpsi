import { create } from 'zustand'

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
  
  fetchPlaylists: () => Promise<void>
  loadLocalPlaylists: (files: FileList) => Promise<void>
  setActiveChannel: (channel: Channel) => void
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
  const lines = content.split('\n')
  const channels: Channel[] = []
  let currentChannel: Partial<Channel> = {}
  let channelIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.*)$/)
      const groupMatch = line.match(/group-title="([^"]*)"/)
      const logoMatch = line.match(/tvg-logo="([^"]*)"/)

      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : 'Desconhecido',
        group: groupMatch ? groupMatch[1].trim() : 'Geral',
        logo: logoMatch ? logoMatch[1].trim() : '',
      }
    } else if (line.length > 0 && !line.startsWith('#')) {
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

export const useIptvStore = create<IptvState>((set) => ({
  channels: [],
  groups: [],
  activeChannel: null,
  isLoading: false,
  error: null,

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  fetchPlaylists: async () => {
    set({ isLoading: true, error: null })
    try {
      let allChannels: Channel[] = []
      
      const fetchPromises = PLAYLIST_URLS.map(async (url, index) => {
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`HTTP error ${response.status}`)
          const content = await response.text()
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
      const { channels: existingChannels } = useIptvStore.getState()
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
}))
