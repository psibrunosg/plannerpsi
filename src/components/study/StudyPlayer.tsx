import { useEffect, useRef, useState } from 'react'
import { Headphones, Video, PictureInPicture2, AlertCircle } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { getDriveStreamUrl } from '@/lib/drive'
import { cn } from '@/lib/cn'

export function StudyPlayer() {
  const { activeLesson, isAudioMode, setIsAudioMode } = useStudyStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset error when lesson changes
  useEffect(() => {
    setError(null)
  }, [activeLesson])

  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (err) {
      console.error('Falha ao usar Picture-in-Picture:', err)
    }
  }

  // Handle syncing playback time when switching between audio and video
  const toggleMode = () => {
    const currentMedia = isAudioMode ? audioRef.current : videoRef.current
    const targetMedia = !isAudioMode ? audioRef.current : videoRef.current
    
    if (currentMedia && targetMedia) {
      targetMedia.currentTime = currentMedia.currentTime
      if (!currentMedia.paused) {
        targetMedia.play().catch(e => console.error("Playback falhou:", e))
      }
      currentMedia.pause()
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

  const renderMedia = () => {
    if (isAudioMode) {
      if (!hasAudio) return <div className="p-8 text-center text-text-muted">Áudio não disponível para esta aula.</div>
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface p-8">
          <Headphones className="mb-6 h-16 w-16 text-accent animate-pulse opacity-80" />
          <p className="mb-6 text-center font-medium text-text-primary max-w-sm truncate">{activeLesson.baseName}</p>
          <audio 
            ref={audioRef}
            src={getDriveStreamUrl(activeLesson.audioFile!.id)}
            controls 
            className="w-full max-w-md accent-accent"
            autoPlay
            onError={() => setError('Erro ao carregar áudio. Verifique sua conexão ou se o arquivo é suportado.')}
          />
        </div>
      )
    } else {
      if (!hasVideo) return <div className="p-8 text-center text-text-muted">Vídeo não disponível para esta aula.</div>
      return (
        <video
          ref={videoRef}
          src={getDriveStreamUrl(activeLesson.videoFile!.id)}
          controls
          autoPlay
          className="h-full w-full object-contain bg-black"
          onError={() => setError('Erro ao carregar vídeo. Verifique sua conexão ou se o arquivo é suportado.')}
        />
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
            <p className="text-xs text-text-muted mt-2 max-w-md">O Google Drive pode estar bloqueando o stream direto por excesso de acessos, ou o formato não é suportado pelo navegador.</p>
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
