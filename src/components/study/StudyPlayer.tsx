import { useEffect, useRef, useState } from 'react'
import { Headphones, Video, PictureInPicture2, AlertCircle, CheckCircle } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { studyMedia } from '@/lib/studyMedia'
import { cn } from '@/lib/cn'

export function StudyPlayer() {
  const { activeLesson, isAudioMode, setIsAudioMode, completedLessons, toggleLessonCompleted } = useStudyStore()
  const audioContainerRef = useRef<HTMLDivElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [useIframeFallback, setUseIframeFallback] = useState(false)

  // Reset states when lesson changes
  useEffect(() => {
    setError(null)
    setUseIframeFallback(false)
  }, [activeLesson])

  // Reset error when toggling mode
  useEffect(() => {
    setError(null)
  }, [isAudioMode])

  // Mount/Unmount global media elements
  useEffect(() => {
    if (!activeLesson) return

    if (isAudioMode && audioContainerRef.current) {
      audioContainerRef.current.appendChild(studyMedia.audio)
      studyMedia.audio.style.display = 'block'
    } else if (!isAudioMode && videoContainerRef.current && !useIframeFallback) {
      videoContainerRef.current.appendChild(studyMedia.video)
      studyMedia.video.style.display = 'block'
    }

    return () => {
      studyMedia.hideAndDock()
    }
  }, [activeLesson, isAudioMode, useIframeFallback])

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await studyMedia.video.requestPictureInPicture()
      }
    } catch (err) {
      console.error('Falha ao usar Picture-in-Picture:', err)
    }
  }

  // Handle syncing playback time when switching between audio and video
  const toggleMode = () => {
    if (isAudioMode) {
      studyMedia.video.currentTime = studyMedia.audio.currentTime
    } else {
      studyMedia.audio.currentTime = studyMedia.video.currentTime
    }
    setIsAudioMode(!isAudioMode)
  }

  if (!activeLesson) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-surface-hover border border-border-subtle shadow-sm">
        <Video className="mb-3 h-10 w-10 text-text-muted opacity-30" />
        <p className="text-sm font-medium text-text-muted">Selecione uma aula para começar</p>
      </div>
    )
  }

  const hasVideo = !!activeLesson.videoFile
  const hasAudio = !!activeLesson.audioFile
  const isCompleted = completedLessons.includes(activeLesson.baseName)

  const handleVideoError = () => {
    // If native video fails, fallback to Google Drive iframe player
    setUseIframeFallback(true)
  }

  // Add error listener to global media to trigger fallback
  useEffect(() => {
    if (!isAudioMode) {
      studyMedia.video.addEventListener('error', handleVideoError)
      return () => studyMedia.video.removeEventListener('error', handleVideoError)
    }
  }, [isAudioMode])

  const renderMedia = () => {
    if (isAudioMode) {
      if (!hasAudio) return <div className="p-8 text-center text-text-muted">Áudio não disponível para esta aula.</div>
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface p-8">
          <Headphones className="mb-6 h-16 w-16 text-accent animate-pulse opacity-80" />
          <p className="mb-6 text-center font-medium text-text-primary max-w-sm truncate">{activeLesson.baseName}</p>
          <div ref={audioContainerRef} className="w-full flex justify-center max-w-md" />
        </div>
      )
    } else {
      if (!hasVideo) return <div className="p-8 text-center text-text-muted">Vídeo não disponível para esta aula.</div>
      
      if (useIframeFallback) {
        return (
          <iframe 
            src={`https://drive.google.com/file/d/${activeLesson.videoFile!.id}/preview`}
            className="h-full w-full border-none"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        )
      }

      return (
        <div ref={videoContainerRef} className="h-full w-full bg-black flex items-center justify-center" />
      )
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border-subtle shadow-lg bg-black">
        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-surface-hover p-6 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-danger" />
            <p className="text-sm text-text-primary">{error}</p>
          </div>
        ) : (
          renderMedia()
        )}
      </div>

      <div className="flex items-center justify-between glass-card p-3 px-4">
        <div className="flex-1 truncate pr-4">
          <h3 className="truncate font-semibold text-text-primary" title={activeLesson.baseName}>
            {activeLesson.baseName}
          </h3>
        </div>
        
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => toggleLessonCompleted(activeLesson.baseName)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isCompleted 
                ? "bg-success/10 text-success border-success/30 hover:bg-success/20" 
                : "border-border-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{isCompleted ? 'Concluída' : 'Marcar Concluída'}</span>
          </button>

          {hasAudio && hasVideo && (
            <button
              onClick={toggleMode}
              className={cn(
                "flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover",
                isAudioMode ? "bg-accent/10 text-accent border-accent/30" : "text-text-secondary"
              )}
            >
              {isAudioMode ? <Video className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
              <span className="hidden sm:inline">{isAudioMode ? 'Mudar para Vídeo' : 'Modo Áudio'}</span>
            </button>
          )}

          {!isAudioMode && hasVideo && (
            <button
              onClick={togglePiP}
              title="Picture-in-Picture"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
