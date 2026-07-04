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
    id: 'alegria-fm',
    name: 'Rádio Alegria FM',
    url: 'https://superaudio.radio.br/stream/alegrianh',
    favicon: 'https://cdn.instant.audio/images/logos/radiosaovivo-net/alegria-poa.png',
    countrycode: 'BR',
    tags: 'sertanejo,rs,alegria'
  },

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
  },
  {
    id: '46d02cdb-49a6-11e9-a4d7-52543be04c81',
    name: 'Rádio Gaúcha (RS)',
    url: 'https://1132747t.ha.azioncdn.net/primary/gaucha_rbs.sdp/playlist.m3u8',
    favicon: 'https://cdn.instant.audio/images/logos/radiosaovivo-net/gaucha-poa.png',
    countrycode: 'BR',
    tags: 'rs,notícias,futebol,brasil'
  },
  {
    id: '521e0177-f6a0-4207-9ec4-c780befc06a9',
    name: 'Rádio Atlântida (Rede)',
    url: 'https://27353.live.streamtheworld.com:443/ATL_FLO.mp3',
    favicon: 'https://cdn.instant.audio/images/logos/radiosaovivo-net/atlantida-poa.png',
    countrycode: 'BR',
    tags: 'rs,pop,rock,brasil'
  },
  {
    id: '3998f9ae-ed80-4319-8109-0acb29efb256',
    name: 'BH FM 102.1',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BHFMAAC.aac',
    favicon: 'https://i.postimg.cc/ncT9hqH6/04008003142.png',
    countrycode: 'BR',
    tags: 'pop,sertanejo,brasil'
  },
  {
    id: 'f5198fbd-3ce3-40fd-ba7b-3669acf99680',
    name: 'Amor 90.9',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/XHOKFMAAC.aac',
    favicon: 'https://i.iheart.com/v3/re/new_assets/5de5724ef553a4f94f50fe05?ops=fit(240%2C240)',
    countrycode: 'MX',
    tags: 'romantica,pop'
  },
  {
    id: 'd11f4ae1-8302-4883-b4b3-f02d308e3dda',
    name: 'Hot 102',
    url: 'https://server7.servistreaming.com/proxy/hot?mp=%2Fstream%3Ftype%3D.mp3&_=1',
    favicon: 'https://hot102pr.com/favicon.ico',
    countrycode: 'PR',
    tags: 'pop,mainstream'
  },
  {
    id: '00bc4f1d-050c-49ae-bc42-a8aaa5d0ff5b',
    name: 'Sertaneja 106.7',
    url: 'https://sc4s.cdn.upx.com:8067/stream',
    favicon: 'https://assets.clubefm.com.br/uploads/site/logo/2/106-sertaneja-4fff3e1f118ab621432fa4d74136e042e86b6eedbabf561ded0dfd61123d980e.png',
    countrycode: 'BR',
    tags: 'sertanejo,brasil'
  },
  {
    id: 'a41c5dcc-7cd8-44da-a071-d74a3ea01ce4',
    name: 'Metropolitana FM (Maceió/SP)',
    url: 'https://streaming.livespanel.com:8032/maceiofm',
    favicon: 'https://www.radios.com.br/aovivo/radio-metropolitana-977-fm/260824',
    countrycode: 'BR',
    tags: 'pop,rock,sertanejo'
  },
  {
    id: 'be54b4d2-f3f6-45d5-b449-06adcaf36830',
    name: '89 FM A Rádio Rock (SP)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_89FM_ADP.aac?dist=site-89fm',
    favicon: 'https://www.radiorock.com.br/wp-content/uploads/2019/04/cropped-favicon-1-32x32.png',
    countrycode: 'BR',
    tags: 'rock,alternativo'
  },
  {
    id: 'b443a768-fca4-42cb-8b4a-6a3437399c27',
    name: 'FM O DIA 100.5 (RJ)',
    url: 'http://streaming.livespanel.com:20000/live',
    favicon: 'https://fmodia.com.br/wp-content/uploads/2021/04/cropped-favicon-fmodia-32x32.png',
    countrycode: 'BR',
    tags: 'pagode,funk,pop'
  },
  {
    id: '66ffbb08-88bd-11e9-ad01-52543be04c81',
    name: 'Jovem Pan (Porto Alegre)',
    url: 'http://centova6.ciclanohost.com.br:9256/;',
    favicon: 'https://s.jpimg.com.br/wp-content/themes/jovempan/assets/build/images/favicons/apple-touch-icon.png',
    countrycode: 'BR',
    tags: 'pop,news'
  },
  {
    id: '6a436cad-5aa9-4a8d-a879-7f8328749b3e',
    name: 'Caracol Radio (Colômbia)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CARACOL_RADIOAAC.aac',
    favicon: 'https://caracol.com.co/pf/resources/caracol-colombia/touch-icon-ipad.png?d=174',
    countrycode: 'CO',
    tags: 'news,talk'
  },
  {
    id: 'bc36c5f0-7b45-479f-aa41-3caf3a912377',
    name: 'Radioacktiva (Bogotá)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ACTIVAAAC.aac',
    favicon: 'https://www.radioacktiva.com/wp-content/uploads/2024/12/cropped-favicon-new1-180x180.png',
    countrycode: 'CO',
    tags: 'classic rock'
  },
  {
    id: 'b95692d0-9b6f-4810-b6e6-395bbe6a5d0b',
    name: 'WKAQ 580 (Porto Rico)',
    url: 'https://televicentro.streamguys1.com/wkaqam-icy?key=a548fad34362b181adc2d8c3cc86b7cf1d424ef2d81c4050b3e6e1ba21f8de3d&source=tunein&source=TuneIn&us_privacy=1YNY&bundle=tunein.com&lat=18.4038&long=-66.1493&aw_0_1st.playerid=RadioTime&aw_0_1st.skey=1772682016&aw_0_1st.bundleId=tunein.com&lon=-66.1493&listenerid=555c2c74177be24010a700c94e4e5933&aw_0_1st.abtest=&partnerId=RadioTime&aw_0_1st.stationId=s30075&aw_0_1st.premium=false&aw_0_1st.platform=tunein&aw_0_1st.genre_id=g255&aw_0_1st.class=talk&aw_0_1st.ads_partner_alias=dsk.Web&aw_0_azn.planguage=[iv,%20es]&aw_0_1st.is_ondemand=false&aw_0_1st.topicId=na&aw_0_1st.affiliateIds=a116918,a40075,a39100&aw_0_1st.bandId=1&delivery=1&aw_0_1st.lotamesegments=;;',
    favicon: 'https://bloximages.chicago2.vip.townnews.com/wkaq580.com/content/tncms/custom/image/9732c65a-a5bb-11ee-8102-67d137cd6b72.png?resize=400%2C167',
    countrycode: 'PR',
    tags: 'news,talk'
  },
  {
    id: '747c7cb7-e1d6-4447-ad7f-5fd8de9157a3',
    name: 'Sport 890 (Uruguai)',
    url: 'https://alba-uy-sport890-sport890.stream.mediatiquestream.com/index.m3u8',
    favicon: 'https://firebasestorage.googleapis.com/v0/b/radiogalaxy-580f4.appspot.com/o/images%2FIMG_20240623_101428021.jpg?alt=media&token=4553b784-4a5a-41b8-ae80-1e11e7359772',
    countrycode: 'UY',
    tags: 'deportes,noticias'
  },
  {
    id: 'f05a93b9-c679-481f-b793-1a43d45c1e90',
    name: 'Band FM Triângulo 99.9 Mhz',
    url: 'https://stm28.xcast.com.br:11364/stream',
    favicon: 'https://bandfmcambui.com.br/wp-content/uploads/2018/12/cropped-favicon-1-32x32.png',
    countrycode: 'BR',
    tags: 'música popular,brasil'
  },
  {
    id: '59b79175-8524-45ad-ba89-bb6c16d7e2c0',
    name: 'Mix FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFM_POAAAC.aac',
    favicon: 'https://radiomixfm.com.br/wp-content/uploads/2021/03/cropped-favicon-32x32.png',
    countrycode: 'BR',
    tags: 'jovem,pop-rock'
  },
  {
    id: '44c845a6-12f3-42d7-90d8-687994d51f14',
    name: 'W Radio',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WRADIOAAC.aac',
    favicon: 'https://www.wradio.com.co/pf/resources/wradio-colombia/touch-icon-ipad.png?d=248',
    countrycode: 'CO',
    tags: 'news,talk'
  },
  {
    id: '6f022fbe-c202-4c7d-bd6c-b14953f9163a',
    name: 'La Mega 92.9 FM',
    url: 'https://us-b4-p-e-qg12-audio.cdn.mdstrm.com/live-audio-aw/632cb48f613bac0856b931ab',
    favicon: 'https://cdn.lamega.com.co/wp-content/uploads/2021/11/cropped-logo-lamega-32x32.png',
    countrycode: 'CO',
    tags: 'entretenimiento,pop'
  },
  {
    id: '4dc3cedb-ff17-46ce-86d6-65f874532d5c',
    name: 'Sarandi 690',
    url: 'https://radiolatina.live:10977/sarandi',
    favicon: 'https://www.sarandi690.com.uy/wp-content/uploads/2019/12/cropped-favicon-32x32.png',
    countrycode: 'UY',
    tags: 'news,talk'
  },
  {
    id: 'f51dc707-4538-4f8d-8fd2-2933013c8389',
    name: 'Azul FM 101.9',
    url: 'https://azul-2.nty.uy/',
    favicon: '',
    countrycode: 'UY',
    tags: 'indie,rock'
  },
  {
    id: 'e3f0dd24-ebee-11e8-a471-52543be04c81',
    name: 'AZ Rock',
    url: 'http://cassini.shoutca.st:9300/stream',
    favicon: 'https://azrockradio.com/wp-content/uploads/2019/10/cropped-favicon-32x32.png',
    countrycode: 'PR',
    tags: 'rock'
  },
  {
    id: 'b8999692-0fba-4660-8934-c74167efc9e0',
    name: 'Antena 1  - Porto Alegre',
    url: 'https://antenaone.crossradio.com.br/stream/1',
    favicon: 'https://www.antena1.com.br/apple-touch-icon.png',
    countrycode: 'BR',
    tags: ''
  },
  {
    id: '9cc39d6a-ee85-4b81-95bf-92b6141670c8',
    name: 'Rádio Transamérica 100.1 FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RT_SPAAC.aac',
    favicon: 'https://img.radios.com.br/radio/lg/radio8803_1578516680.png',
    countrycode: 'BR',
    tags: 'música pop,sertanejo,sertanejo raiz'
  },
  {
    id: '1261b546-da1d-4525-8119-44d5c7112ec8',
    name: 'Rádio Guaíba',
    url: 'https://radio.saopaulo01.com.br:10827/stream',
    favicon: 'https://guaiba.com.br/wp-content/uploads//2025/03/svgviewer-output.svg',
    countrycode: 'BR',
    tags: ''
  },
  {
    id: '940b0a24-b79f-41b1-915f-d05ed49b8e82',
    name: 'Tropicana (Medellín) 98.9 FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TR_MEDELLINAAC.aac',
    favicon: 'https://www.tropicanafm.com/wp-content/uploads/2021/02/cropped-favicon_tropicana-32x32.png',
    countrycode: 'CO',
    tags: 'salsa'
  },
  {
    id: 'bc6840d8-645e-4ba0-ab6c-76f37808d2c7',
    name: 'Medellin 104.9 - Olimpica Stereo',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OLP_MEDELLINAAC.aac?1707017722',
    favicon: 'http://www.olimpicastereo.com.co/icon?b8748d2f62517688',
    countrycode: 'CO',
    tags: ''
  },
  {
    id: 'ab414e56-3733-4c14-845a-b82d73fb099c',
    name: 'Fidelity 95.7',
    url: 'https://server7.servistreaming.com/proxy/fidelity?_=1&mp=/stream?type=.mp3',
    favicon: 'https://fidelitypr.com/wp-content/uploads/2025/09/cropped-Untitled-design-45.png',
    countrycode: 'PR',
    tags: ''
  },
  {
    id: '130a1d84-3350-494a-b27c-4d8ac3b8e77c',
    name: 'CX 20 Radio Monte Carlo',
    url: 'https://streamingcasazorrilla.innovanexo.com:8000/montecarlo.mp3',
    favicon: '',
    countrycode: 'UY',
    tags: 'aqui esta su disco,la super radio,music'
  },
  {
    id: '96443c16-bb54-4437-964d-eef2d6f65239',
    name: 'Del Sol FM',
    url: 'https://delsol-1.nty.uy/?type=http&nocache=2780&dbl=0',
    favicon: 'https://delsol.uy/favicon.ico',
    countrycode: 'UY',
    tags: ''
  }
]

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
  initStations: () => void
  searchStations: (query: string) => Promise<void>
}

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      volume: 0.5,
      currentStation: null,
      stations: CURATED_STATIONS,
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

      searchStations: async (query) => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) {
          set({ stations: CURATED_STATIONS })
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
          set({ stations: CURATED_STATIONS })
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
