import { BookOpen, Pause, Play, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStudyStore } from '@/stores/studyStore'
import { studyMedia } from '@/lib/studyMedia'

export function StudyControls() {
  const { activeLesson, isPlaying, isAudioMode } = useStudyStore()

  if (!activeLesson) return null

  const togglePlay = () => {
    const media = isAudioMode ? studyMedia.audio : studyMedia.video
    if (isPlaying) {
      media.pause()
    } else {
      media.play().catch(console.error)
    }
  }

  return (
    <div className="group relative flex items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className={`flex items-center justify-center rounded-full p-2 transition-colors ${
          isPlaying
            ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
            : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
        }`}
      >
        <BookOpen className={`h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
      </motion.button>

      {/* Popover */}
      <div className="absolute right-0 top-full mt-2 hidden w-64 origin-top-right rounded-xl border border-border-subtle bg-surface p-4 shadow-xl group-hover:block z-50">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
          {isAudioMode ? <BookOpen className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          Aula em andamento
        </h3>
        
        <p className="mb-4 text-xs text-text-muted line-clamp-2">
          {activeLesson.baseName}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-[10px] font-medium text-accent uppercase tracking-wider">
            {isAudioMode ? 'Áudio' : 'Vídeo'}
          </span>
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-md hover:bg-accent-hover transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
