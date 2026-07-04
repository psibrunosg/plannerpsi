import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Play, Pause, SkipBack, SkipForward, ListMusic } from 'lucide-react'
import { useSpotifyStore } from '@/stores/spotifyStore'
import { beginLogin } from '@/lib/spotifyAuth'
import { cn } from '@/lib/cn'

const POLL_OPEN_MS = 5000
const POLL_CLOSED_MS = 30000

export function SpotifyControls() {
  const {
    playbackState, playlists, isLoading,
    fetchPlayback, play, pause, next, previous, fetchPlaylists,
  } = useSpotifyStore()
  const isConnected = useSpotifyStore((s) => s.isConnected())
  const [isOpen, setIsOpen] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)

  useEffect(() => {
    if (!isConnected) return
    fetchPlayback()
    const interval = setInterval(fetchPlayback, isOpen ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => clearInterval(interval)
  }, [isConnected, isOpen, fetchPlayback])

  useEffect(() => {
    if (isOpen && showPlaylists && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [isOpen, showPlaylists, playlists.length, fetchPlaylists])

  const isPlaying = !!playbackState?.isPlaying

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center rounded-full p-2 transition-colors",
          isPlaying ? "bg-success/20 text-success" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
        )}
        title="Spotify"
      >
        <Music className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border-subtle bg-surface p-4 shadow-xl z-50"
            >
              {!isConnected ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <Music className="h-8 w-8 text-success opacity-60" />
                  <p className="text-sm text-text-secondary">Conecte sua conta Spotify para controlar a reprodução por aqui.</p>
                  <button
                    onClick={() => beginLogin()}
                    className="rounded-full bg-success/15 px-4 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition-colors"
                  >
                    Conectar com Spotify
                  </button>
                </div>
              ) : !playbackState ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Music className="h-8 w-8 text-text-muted opacity-30" />
                  <p className="text-sm text-text-muted">Nenhum dispositivo ativo.</p>
                  <p className="text-xs text-text-muted">Abra o Spotify no seu PC ou celular e comece a tocar algo.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    {playbackState.albumImageUrl ? (
                      <img src={playbackState.albumImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-hover">
                        <Music className="h-5 w-5 text-text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{playbackState.trackName || 'Sem faixa'}</p>
                      <p className="truncate text-xs text-text-muted">{playbackState.artists}</p>
                      {playbackState.deviceName && (
                        <p className="truncate text-[10px] text-text-muted opacity-70">{playbackState.deviceName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-center gap-2">
                    <button onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-success transition-colors">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => isPlaying ? pause() : play()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shadow-md hover:brightness-110 transition-all"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                    </button>
                    <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-success transition-colors">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPlaylists((v) => !v)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border-subtle py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
                  >
                    <ListMusic className="h-3.5 w-3.5" />
                    Playlists
                  </button>

                  {showPlaylists && (
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto custom-scrollbar">
                      {isLoading ? (
                        <p className="p-2 text-center text-xs text-text-muted">Carregando...</p>
                      ) : playlists.length === 0 ? (
                        <p className="p-2 text-center text-xs text-text-muted">Nenhuma playlist encontrada.</p>
                      ) : (
                        playlists.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => play(p.uri)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
                            ) : (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-hover">
                                <ListMusic className="h-3 w-3 text-text-muted" />
                              </div>
                            )}
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
