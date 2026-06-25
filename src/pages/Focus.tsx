import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Timer, Flame } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition } from '@/lib/motion'
import { useFocusStore } from '@/stores/focusStore'

export default function Focus() {
  const activeSession = useFocusStore((s) => s.activeSession)
  const pomodoroSettings = useFocusStore((s) => s.pomodoroSettings)
  const completedPomodoros = useFocusStore((s) => s.completedPomodoros)
  const startSession = useFocusStore((s) => s.startSession)
  const pauseSession = useFocusStore((s) => s.pauseSession)
  const resumeSession = useFocusStore((s) => s.resumeSession)
  const endSession = useFocusStore((s) => s.endSession)
  const tick = useFocusStore((s) => s.tick)

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

  const minutes = activeSession ? Math.floor(activeSession.remaining / 60) : pomodoroSettings.workMinutes
  const seconds = activeSession ? activeSession.remaining % 60 : 0
  const progress = activeSession ? ((activeSession.duration - activeSession.remaining) / activeSession.duration) * 100 : 0

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Modo Foco</span></h1>
        <p className="mt-1 text-text-secondary">Concentre-se no que importa</p>
      </div>

      <motion.div className="relative mb-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        <svg className="h-64 w-64 -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="120" fill="none" stroke="var(--color-border)" strokeWidth="6" />
          <motion.circle cx="130" cy="130" r="120" fill="none" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} animate={{ strokeDashoffset }} transition={{ duration: 0.5, ease: 'easeOut' }}
            className="drop-shadow-[0_0_8px_var(--color-accent)]" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-6xl font-bold text-text-primary tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="mt-2 text-sm text-text-muted">
            {activeSession ? (activeSession.type === 'pomodoro' ? 'Pomodoro' : activeSession.type === 'break' ? 'Pausa' : 'Deep Work') : 'Pronto'}
          </span>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 mb-8">
        {!activeSession ? (
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => startSession(null, 'pomodoro', pomodoroSettings.workMinutes)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover glow-accent">
              <Play className="h-5 w-5" />Iniciar Pomodoro
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => startSession(null, 'deep_work', 50)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-elevated px-6 py-3 text-sm font-medium text-text-secondary hover:bg-surface-hover">
              <Timer className="h-5 w-5" />Deep Work (50m)
            </motion.button>
          </>
        ) : (
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={activeSession.isPaused ? resumeSession : pauseSession}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover">
              {activeSession.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              {activeSession.isPaused ? 'Retomar' : 'Pausar'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={endSession}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-elevated px-6 py-3 text-sm font-medium text-text-secondary hover:bg-surface-hover">
              <RotateCcw className="h-5 w-5" />Encerrar
            </motion.button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-text-muted">
        <Flame className={cn('h-5 w-5', completedPomodoros > 0 && 'text-danger')} />
        <span className="text-sm">{completedPomodoros} pomodoro{completedPomodoros !== 1 ? 's' : ''} hoje</span>
      </div>
    </motion.div>
  )
}
