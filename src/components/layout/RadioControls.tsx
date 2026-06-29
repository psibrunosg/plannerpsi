import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/cn'

export function RadioControls() {
  const { 
    isPlaying, setIsPlaying, 
    volume, setVolume, 
    currentStation, setCurrentStation,
    favorites
  } = useRadioStore()

  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Mini Player Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-sm)] p-2 transition-colors",
          isPlaying ? "bg-accent/10 text-accent hover:bg-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
        )}
        title="Rádio"
      >
        <Radio className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
      </motion.button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-2xl glass"
            >
              <div className="p-4 flex flex-col gap-4">
                {/* Now Playing Header */}
                <div className="flex items-center gap-3 bg-surface-hover p-3 rounded-md border border-border-subtle">
                  <button 
                    onClick={() => currentStation ? setIsPlaying(!isPlaying) : null}
                    disabled={!currentStation}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {currentStation ? currentStation.name : 'Nenhuma rádio selecionada'}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {currentStation ? currentStation.tags.split(',')[0] || 'Ao vivo' : 'Escolha uma estação'}
                    </p>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2 px-1">
                  <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="text-text-muted hover:text-text-primary transition-colors">
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-full bg-border-subtle appearance-none cursor-pointer accent-accent" 
                  />
                </div>

                <hr className="border-border-subtle" />

                {/* Stations List */}
                <div className="h-48 overflow-y-auto custom-scrollbar -mx-2 px-2 flex flex-col gap-1">
                  {favorites.length > 0 ? (
                    favorites.map(station => (
                      <button
                        key={station.id}
                        onClick={() => setCurrentStation(station)}
                        className={cn(
                          "flex items-center gap-3 rounded-md p-2 text-left transition-colors",
                          currentStation?.id === station.id 
                            ? "bg-accent/10" 
                            : "hover:bg-surface-hover"
                        )}
                      >
                        {station.favicon ? (
                          <img src={station.favicon} alt="" className="h-8 w-8 rounded-sm object-cover bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-border-subtle">
                            <Radio className="h-4 w-4 text-text-muted" />
                          </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className={cn(
                            "truncate text-sm font-medium",
                            currentStation?.id === station.id ? "text-accent" : "text-text-primary"
                          )}>
                            {station.name}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {station.tags.split(',').slice(0, 2).join(', ')}
                          </p>
                        </div>
                        {currentStation?.id === station.id && isPlaying && (
                          <div className="flex gap-0.5 mr-1 h-3 items-end">
                            <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-accent rounded-t-sm" />
                            <motion.div animate={{ height: ["80%", "30%", "80%"] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 bg-accent rounded-t-sm" />
                            <motion.div animate={{ height: ["50%", "100%", "50%"] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.1 }} className="w-1 bg-accent rounded-t-sm" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-text-muted p-4">
                      <Radio className="mb-2 h-6 w-6 opacity-20" />
                      <p className="text-sm">Nenhuma favorita encontrada.</p>
                      <p className="text-xs mt-1">Vá em Configurações para adicionar rádios.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
