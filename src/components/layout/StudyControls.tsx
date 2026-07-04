import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Pause, Play, Video, SkipBack, SkipForward, Rewind, FastForward, Volume2, VolumeX } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { studyMedia } from '@/lib/studyMedia'
import { cn } from '@/lib/cn'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StudyControls() {
  const {
    activeLesson, isPlaying, isAudioMode,
    playNextLesson, playPreviousLesson, volume, setVolume
  } = useStudyStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const media = isAudioMode ? studyMedia.audio : studyMedia.video

  useEffect(() => {
    if (!isOpen) return

    const handleTimeUpdate = () => setCurrentTime(media.currentTime)
    const handleLoadedMetadata = () => setDuration(media.duration || 0)

    setCurrentTime(media.currentTime)
    setDuration(media.duration || 0)

    media.addEventListener('timeupdate', handleTimeUpdate)
    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate)
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [isOpen, media])

  if (!activeLesson) return null

  const togglePlay = () => {
    if (isPlaying) {
      media.pause()
    } else {
      media.play().catch(console.error)
    }
  }

  const seek = (deltaSeconds: number) => {
    media.currentTime = Math.max(0, Math.min(media.duration || Infinity, media.currentTime + deltaSeconds))
  }

  const handleSeekBarChange = (value: number) => {
    media.currentTime = value
    setCurrentTime(value)
  }

  const handleVolumeChange = (value: number) => {
    studyMedia.audio.volume = value
    studyMedia.video.volume = value
    setVolume(value)
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center rounded-full p-2 transition-colors",
          isPlaying
            ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
            : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
        )}
      >
        <BookOpen className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
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
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                {isAudioMode ? <BookOpen className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                Aula em andamento
              </h3>

              <p className="mb-3 text-xs text-text-muted line-clamp-2">
                {activeLesson.baseName}
              </p>

              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(e) => handleSeekBarChange(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between text-[10px] text-text-muted tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-center gap-2">
                <button onClick={playPreviousLesson} title="Aula anterior" className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button onClick={() => seek(-10)} title="Retroceder 10s" className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors">
                  <Rewind className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md hover:bg-accent-hover transition-colors"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </button>
                <button onClick={() => seek(10)} title="Avançar 10s" className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors">
                  <FastForward className="h-4 w-4" />
                </button>
                <button onClick={playNextLesson} title="Próxima aula" className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)} className="text-text-muted hover:text-text-secondary transition-colors">
                  {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
