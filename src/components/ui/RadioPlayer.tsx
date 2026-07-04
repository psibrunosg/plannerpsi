import { useEffect, useRef } from 'react'
import { useRadioStore } from '@/stores/radioStore'
import { useToastStore } from '@/stores/toastStore'

const MAX_RETRIES = 2
const RETRY_DELAYS_MS = [1000, 3000]

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastLoadedUrl = useRef<string | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlaying = useRadioStore(s => s.isPlaying)
  const volume = useRadioStore(s => s.volume)
  const currentStation = useRadioStore(s => s.currentStation)
  const setIsPlaying = useRadioStore(s => s.setIsPlaying)
  const addToast = useToastStore(s => s.addToast)

  const clearRetryTimer = () => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
  }

  // Handle initialization and source changes
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current

    if (currentStation) {
      if (lastLoadedUrl.current !== currentStation.url) {
        audio.src = currentStation.url
        audio.load()
        lastLoadedUrl.current = currentStation.url
        retryCount.current = 0
        clearRetryTimer()
      }

      if (isPlaying) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback error:", error)
            setIsPlaying(false)
            // Autoplay permission errors are not stream failures — don't blame the station
            if (error?.name !== 'NotAllowedError') {
              addToast('Não foi possível reproduzir esta rádio. Tente outra.', 'error')
            }
          })
        }
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
      audio.src = ''
      lastLoadedUrl.current = null
      retryCount.current = 0
      clearRetryTimer()
    }
  }, [currentStation, isPlaying]) // removed setIsPlaying and addToast to prevent unnecessary re-runs

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => clearRetryTimer, [])

  const handleStreamFailure = () => {
    const { isPlaying: playing, currentStation: station } = useRadioStore.getState()
    if (!station) return

    if (playing && retryCount.current < MAX_RETRIES) {
      const attempt = retryCount.current
      retryCount.current++
      if (attempt === 0) {
        addToast('Reconectando à rádio...', 'info')
      }
      clearRetryTimer()
      retryTimer.current = setTimeout(() => {
        const audio = audioRef.current
        const { currentStation: stillStation, isPlaying: stillPlaying } = useRadioStore.getState()
        if (!audio || !stillStation || !stillPlaying) return
        audio.src = stillStation.url
        audio.load()
        audio.play().catch(() => {
          setIsPlaying(false)
          addToast('Erro na transmissão. A rádio pode estar offline.', 'error')
        })
      }, RETRY_DELAYS_MS[attempt])
      return
    }

    setIsPlaying(false)
    addToast('Erro na transmissão. A rádio pode estar offline.', 'error')
  }

  return (
    <audio
      ref={audioRef}
      onEnded={() => setIsPlaying(false)}
      onPlaying={() => { retryCount.current = 0 }}
      onError={handleStreamFailure}
      className="hidden"
    />
  )
}
