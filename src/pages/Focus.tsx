import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Timer, Flame, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition } from '@/lib/motion'
import { useFocusStore } from '@/stores/focusStore'
import { useUIStore } from '@/stores/uiStore'

export default function Focus() {
  const activeSession = useFocusStore((s) => s.activeSession)
  const pomodoroSettings = useFocusStore((s) => s.pomodoroSettings)
  const completedPomodoros = useFocusStore((s) => s.completedPomodoros)
  const startSession = useFocusStore((s) => s.startSession)
  const pauseSession = useFocusStore((s) => s.pauseSession)
  const resumeSession = useFocusStore((s) => s.resumeSession)
  const endSession = useFocusStore((s) => s.endSession)
  const tick = useFocusStore((s) => s.tick)
  
  const zenMode = useUIStore((s) => s.zenMode)
  const setZenMode = useUIStore((s) => s.setZenMode)

  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activeSession, activeSession?.isPaused, tick])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Cleanup zen mode on unmount just in case they navigate back or close
  useEffect(() => {
    return () => setZenMode(false)
  }, [setZenMode])

  const minutes = activeSession ? Math.floor(activeSession.remaining / 60) : pomodoroSettings.workMinutes
  const seconds = activeSession ? activeSession.remaining % 60 : 0
  const progress = activeSession ? ((activeSession.duration - activeSession.remaining) / activeSession.duration) * 100 : 0

  const circumference = 2 * Math.PI * (zenMode ? 160 : 120)
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div 
      variants={pageTransition} 
      initial="hidden" 
      animate="visible" 
      exit="exit" 
      className={cn(
        "flex flex-col items-center transition-all duration-1000",
        zenMode ? "justify-center min-h-screen bg-gradient-to-br from-background via-surface to-background fixed inset-0 z-50" : ""
      )}
    >
      <div className="absolute top-6 right-6 z-50">
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setZenMode(!zenMode)}
          className="p-3 rounded-full bg-surface-hover text-text-secondary hover:text-accent transition-colors shadow-lg border border-border-subtle"
          title={zenMode ? "Sair do Modo Zen" : "Entrar no Modo Zen"}
        >
          {zenMode ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-5 w-5" />}
        </motion.button>
      </div>

      {!zenMode && (
        <div className="mb-8 text-center mt-4">
          <h1 className="text-3xl font-bold"><span className="gradient-text">Modo Foco</span></h1>
          <p className="mt-1 text-text-secondary">Concentre-se no que importa</p>
        </div>
      )}

      {zenMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
          <div className="absolute top-0 -right-1/4 w-3/4 h-3/4 bg-purple-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute -bottom-1/2 left-1/4 w-full h-full bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
        </div>
      )}

      <motion.div 
        className="relative mb-12 z-10" 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <svg className={cn("-rotate-90 transition-all duration-1000", zenMode ? "h-96 w-96" : "h-64 w-64")} viewBox={zenMode ? "0 0 340 340" : "0 0 260 260"}>
          <circle cx={zenMode ? "170" : "130"} cy={zenMode ? "170" : "130"} r={zenMode ? "160" : "120"} fill="none" stroke="var(--color-border)" strokeWidth={zenMode ? "4" : "6"} />
          <motion.circle cx={zenMode ? "170" : "130"} cy={zenMode ? "170" : "130"} r={zenMode ? "160" : "120"} fill="none" stroke="var(--color-accent)" strokeWidth={zenMode ? "8" : "6"} strokeLinecap="round"
            strokeDasharray={circumference} animate={{ strokeDashoffset }} transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn("drop-shadow-[0_0_8px_var(--color-accent)]", zenMode && "drop-shadow-[0_0_16px_var(--color-accent)] opacity-80")} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-heading font-bold text-text-primary tabular-nums transition-all duration-1000", zenMode ? "text-8xl tracking-tight" : "text-6xl")}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className={cn("mt-4 text-text-muted transition-all uppercase tracking-widest font-semibold", zenMode ? "text-lg" : "text-sm")}>
            {activeSession ? (activeSession.type === 'pomodoro' ? 'Pomodoro' : activeSession.type === 'break' ? 'Pausa' : 'Deep Work') : 'Pronto'}
          </span>
        </div>
      </motion.div>

      <div className="flex items-center gap-4 z-10">
        {!activeSession ? (
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => startSession(null, 'pomodoro', pomodoroSettings.workMinutes)}
              className={cn("flex items-center gap-2 rounded-full bg-accent font-medium text-white hover:bg-accent-hover glow-accent transition-all", zenMode ? "px-10 py-5 text-lg" : "px-6 py-3 text-sm")}>
              <Play className={zenMode ? "h-6 w-6" : "h-5 w-5"} />Iniciar Pomodoro
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => startSession(null, 'deep_work', 50)}
              className={cn("flex items-center gap-2 rounded-full bg-surface-elevated font-medium text-text-secondary hover:bg-surface-hover border border-border-subtle transition-all", zenMode ? "px-10 py-5 text-lg" : "px-6 py-3 text-sm")}>
              <Timer className={zenMode ? "h-6 w-6" : "h-5 w-5"} />Deep Work (50m)
            </motion.button>
          </>
        ) : (
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={activeSession.isPaused ? resumeSession : pauseSession}
              className={cn("flex items-center gap-2 rounded-full bg-accent font-medium text-white hover:bg-accent-hover transition-all", zenMode ? "px-10 py-5 text-lg" : "px-6 py-3 text-sm")}>
              {activeSession.isPaused ? <Play className={zenMode ? "h-6 w-6" : "h-5 w-5"} /> : <Pause className={zenMode ? "h-6 w-6" : "h-5 w-5"} />}
              {activeSession.isPaused ? 'Retomar' : 'Pausar'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={endSession}
              className={cn("flex items-center gap-2 rounded-full bg-surface-elevated font-medium text-text-secondary hover:bg-surface-hover border border-border-subtle transition-all", zenMode ? "px-10 py-5 text-lg" : "px-6 py-3 text-sm")}>
              <RotateCcw className={zenMode ? "h-6 w-6" : "h-5 w-5"} />Encerrar
            </motion.button>
          </>
        )}
      </div>

      {!zenMode && (
        <div className="flex items-center gap-2 text-text-muted mt-8">
          <Flame className={cn('h-5 w-5', completedPomodoros > 0 && 'text-danger')} />
          <span className="text-sm">{completedPomodoros} pomodoro{completedPomodoros !== 1 ? 's' : ''} hoje</span>
        </div>
      )}
    </motion.div>
  )
}
