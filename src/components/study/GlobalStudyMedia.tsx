import { useEffect } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { studyMedia } from '@/lib/studyMedia'
import { getDriveStreamUrl } from '@/lib/drive'

export function GlobalStudyMedia() {
  const { activeLesson, isAudioMode, toggleLessonCompleted, playNextLesson, setIsPlaying } = useStudyStore()

  useEffect(() => {
    if (!activeLesson) return

    const handleEnded = async () => {
      await toggleLessonCompleted(activeLesson.baseName)
      await playNextLesson()
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    // Sync SRC if it changed
    const expectedSrc = getDriveStreamUrl(isAudioMode ? activeLesson.audioFile!.id : activeLesson.videoFile!.id)
    
    const media = isAudioMode ? studyMedia.audio : studyMedia.video
    const otherMedia = isAudioMode ? studyMedia.video : studyMedia.audio

    // Pause the other media
    if (!otherMedia.paused) {
      otherMedia.pause()
    }

    // Only set src if it's different to avoid reloading
    if (media.src !== expectedSrc) {
      media.src = expectedSrc
      media.play().catch(console.error)
    }

    // Attach events to BOTH media just in case they switch
    studyMedia.audio.addEventListener('ended', handleEnded)
    studyMedia.audio.addEventListener('play', handlePlay)
    studyMedia.audio.addEventListener('pause', handlePause)

    studyMedia.video.addEventListener('ended', handleEnded)
    studyMedia.video.addEventListener('play', handlePlay)
    studyMedia.video.addEventListener('pause', handlePause)

    return () => {
      studyMedia.audio.removeEventListener('ended', handleEnded)
      studyMedia.audio.removeEventListener('play', handlePlay)
      studyMedia.audio.removeEventListener('pause', handlePause)

      studyMedia.video.removeEventListener('ended', handleEnded)
      studyMedia.video.removeEventListener('play', handlePlay)
      studyMedia.video.removeEventListener('pause', handlePause)
    }
  }, [activeLesson, isAudioMode, toggleLessonCompleted, playNextLesson, setIsPlaying])

  return null // This component only manages global side-effects and events
}
