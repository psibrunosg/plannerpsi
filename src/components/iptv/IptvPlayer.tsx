import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Tv, AlertCircle } from 'lucide-react'
import { useIptvStore } from '@/stores/iptvStore'

export function IptvPlayer() {
  const { activeChannel } = useIptvStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeChannel) return

    setError(null)

    let hls: Hls | null = null

    const handlePlay = () => {
      video.play().catch(e => {
        console.warn('Auto-play prevented:', e)
      })
    }

    // Check if the URL is an m3u8 playlist
    if (activeChannel.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        })
        
        hls.loadSource(activeChannel.url)
        hls.attachMedia(video)
        
        hls.on(Hls.Events.MANIFEST_PARSED, handlePlay)
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Erro de rede: O canal pode estar offline ou bloqueado por CORS.')
                hls?.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Erro de mídia: Tentando recuperar...')
                hls?.recoverMediaError()
                break
              default:
                setError('Erro fatal ao carregar o canal.')
                hls?.destroy()
                break
            }
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari
        video.src = activeChannel.url
        video.addEventListener('loadedmetadata', handlePlay)
      } else {
        setError('HLS não suportado neste navegador.')
      }
    } else {
      // Direct mp4 or other format
      video.src = activeChannel.url
      video.addEventListener('loadedmetadata', handlePlay)
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
      video.removeEventListener('loadedmetadata', handlePlay)
    }
  }, [activeChannel])

  if (!activeChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] glass-card rounded-xl border border-border-subtle p-8 text-center text-text-muted">
        <Tv className="h-16 w-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Visualizador IPTV</h2>
        <p className="max-w-md">Selecione um canal na barra lateral para começar a assistir.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-xl overflow-hidden border border-border-subtle bg-black relative shadow-lg aspect-video">
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-center p-6">
            <AlertCircle className="h-12 w-12 text-danger mb-4" />
            <p className="text-white font-medium">{error}</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
          crossOrigin="anonymous"
        />
      </div>

      <div className="glass-card p-6 rounded-xl border border-border-subtle space-y-4">
        <div className="flex items-center gap-4">
          {activeChannel.logo ? (
            <img 
              src={activeChannel.logo} 
              alt={activeChannel.name}
              className="h-16 w-16 object-contain rounded bg-surface/50 p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="h-16 w-16 bg-surface/80 rounded flex items-center justify-center">
              <Tv className="h-8 w-8 text-text-muted" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {activeChannel.name}
            </h1>
            <p className="text-text-muted">
              {activeChannel.group || 'Canal de TV'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
