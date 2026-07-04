import { useEffect } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { studyMedia } from '@/lib/studyMedia'
import { getDriveStreamUrl } from '@/lib/drive'

const POSITION_SAVE_INTERVAL_SEC = 5
// Don't resume within this many seconds of the end (avoids re-triggering "ended" on reload)
const RESUME_END_GUARD_SEC = 10

export function GlobalStudyMedia() {
  const {
    activeLesson, isAudioMode, toggleLessonCompleted, playNextLesson, playPreviousLesson, setIsPlaying,
    playbackRate, volume, saveLessonPosition, getLessonPosition,
  } = useStudyStore()

  useEffect(() => {
    if (!activeLesson) return

    const baseName = activeLesson.baseName
    let lastSavedSecond = -1

    const handleEnded = async () => {
      saveLessonPosition(baseName, 0)
      await toggleLessonCompleted(baseName)
      await playNextLesson()
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleTimeUpdate = (e: Event) => {
      const target = e.currentTarget as HTMLMediaElement
      const second = Math.floor(target.currentTime)
      if (second !== lastSavedSecond && second % POSITION_SAVE_INTERVAL_SEC === 0) {
        lastSavedSecond = second
        saveLessonPosition(baseName, target.currentTime)
      }
    }

    const handleLoadedMetadata = (e: Event) => {
      const target = e.currentTarget as HTMLMediaElement
      const savedPosition = getLessonPosition(baseName)
      if (savedPosition > 0 && savedPosition < target.duration - RESUME_END_GUARD_SEC) {
        target.currentTime = savedPosition
      }
    }

    // Sync SRC if it changed
    const expectedSrc = getDriveStreamUrl(isAudioMode ? activeLesson.audioFile!.id : activeLesson.videoFile!.id)

    const media = isAudioMode ? studyMedia.audio : studyMedia.video
    const otherMedia = isAudioMode ? studyMedia.video : studyMedia.audio

    // Pause the other media
    if (!otherMedia.paused) {
      otherMedia.pause()
    }

    media.playbackRate = playbackRate
    media.volume = volume

    // Only set src if it's different to avoid reloading
    if (media.src !== expectedSrc) {
      media.src = expectedSrc
      media.play().catch(console.error)
    }

    // Media Session: gives OS-level controls (Windows overlay, keyboard media keys)
    // so playback can be controlled and keeps going while the app is minimized/unfocused.
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeLesson.baseName,
        artist: 'PlannerPSI',
      })
      navigator.mediaSession.setActionHandler('play', () => media.play().catch(console.error))
      navigator.mediaSession.setActionHandler('pause', () => media.pause())
      navigator.mediaSession.setActionHandler('previoustrack', () => { playPreviousLesson() })
      navigator.mediaSession.setActionHandler('nexttrack', () => { playNextLesson() })
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        media.currentTime = Math.max(0, media.currentTime - (details.seekOffset || 10))
      })
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        media.currentTime = Math.min(media.duration || Infinity, media.currentTime + (details.seekOffset || 10))
      })
    }

    // Attach events to BOTH media just in case they switch
    studyMedia.audio.addEventListener('ended', handleEnded)
    studyMedia.audio.addEventListener('play', handlePlay)
    studyMedia.audio.addEventListener('pause', handlePause)
    studyMedia.audio.addEventListener('timeupdate', handleTimeUpdate)
    studyMedia.audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    studyMedia.video.addEventListener('ended', handleEnded)
    studyMedia.video.addEventListener('play', handlePlay)
    studyMedia.video.addEventListener('pause', handlePause)
    studyMedia.video.addEventListener('timeupdate', handleTimeUpdate)
    studyMedia.video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      // Persist the last known position when leaving/switching the lesson
      if (!media.paused || media.currentTime > 0) {
        saveLessonPosition(baseName, media.currentTime)
      }

      studyMedia.audio.removeEventListener('ended', handleEnded)
      studyMedia.audio.removeEventListener('play', handlePlay)
      studyMedia.audio.removeEventListener('pause', handlePause)
      studyMedia.audio.removeEventListener('timeupdate', handleTimeUpdate)
      studyMedia.audio.removeEventListener('loadedmetadata', handleLoadedMetadata)

      studyMedia.video.removeEventListener('ended', handleEnded)
      studyMedia.video.removeEventListener('play', handlePlay)
      studyMedia.video.removeEventListener('pause', handlePause)
      studyMedia.video.removeEventListener('timeupdate', handleTimeUpdate)
      studyMedia.video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [activeLesson, isAudioMode, toggleLessonCompleted, playNextLesson, playPreviousLesson, setIsPlaying, playbackRate, volume, saveLessonPosition, getLessonPosition])

  return null // This component only manages global side-effects and events
}
