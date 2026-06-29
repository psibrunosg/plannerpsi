import { useEffect, useRef } from 'react'
import { useRadioStore } from '@/stores/radioStore'
import { useToastStore } from '@/stores/toastStore'

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlaying = useRadioStore(s => s.isPlaying)
  const volume = useRadioStore(s => s.volume)
  const currentStation = useRadioStore(s => s.currentStation)
  const setIsPlaying = useRadioStore(s => s.setIsPlaying)
  const addToast = useToastStore(s => s.addToast)

  // Handle initialization and source changes
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current

    if (currentStation) {
      if (audio.src !== currentStation.url) {
        audio.src = currentStation.url
        audio.load()
      }
      
      if (isPlaying) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback error:", error)
            setIsPlaying(false)
            addToast('Não foi possível reproduzir esta rádio. Tente outra.', 'error')
          })
        }
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
      audio.src = ''
    }
  }, [currentStation, isPlaying, setIsPlaying, addToast])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return (
    <audio 
      ref={audioRef}
      onEnded={() => setIsPlaying(false)}
      onError={() => {
        setIsPlaying(false)
        if (currentStation) {
          addToast('Erro na transmissão. A rádio pode estar offline.', 'error')
        }
      }}
      className="hidden" 
    />
  )
}
