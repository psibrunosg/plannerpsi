import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { FocusSession, SessionType } from '@/types'

interface FocusState {
  sessions: FocusSession[]
  activeSession: {
    taskId: string | null
    type: SessionType
    startedAt: number
    duration: number
    remaining: number
    isPaused: boolean
  } | null
  pomodoroSettings: {
    workMinutes: number
    shortBreakMinutes: number
    longBreakMinutes: number
    sessionsBeforeLong: number
  }
  completedPomodoros: number
  loading: boolean
  setSessions: (sessions: FocusSession[]) => void
  fetchSessions: () => Promise<void>
  startSession: (taskId: string | null, type: SessionType, durationMinutes: number) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => Promise<void>
  tick: () => void
  updateRemaining: (remaining: number) => void
  updateSettings: (settings: Partial<FocusState['pomodoroSettings']>) => void
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      pomodoroSettings: {
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        sessionsBeforeLong: 4,
      },
      completedPomodoros: 0,
      loading: false,

      setSessions: (sessions) => set({ sessions }),

      fetchSessions: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true })
        
        // Only fetch today's sessions to calculate completedPomodoros correctly, or fetch recent ones
        const { data, error } = await supabase
          .from('focus_sessions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50)
          
        if (!error && data) {
          const today = new Date().toISOString().split('T')[0]
          const completedToday = data.filter(s => 
            s.session_type === 'pomodoro' && 
            s.started_at.startsWith(today)
          ).length

          set({ sessions: data, completedPomodoros: completedToday, loading: false })
        } else {
          set({ loading: false })
        }
      },

      startSession: (taskId, type, durationMinutes) => set({
        activeSession: {
          taskId,
          type,
          startedAt: Date.now(),
          duration: durationMinutes * 60,
          remaining: durationMinutes * 60,
          isPaused: false,
        },
      }),

      pauseSession: () => set((s) => ({
        activeSession: s.activeSession ? { ...s.activeSession, isPaused: true } : null,
      })),

      resumeSession: () => set((s) => ({
        activeSession: s.activeSession ? { ...s.activeSession, isPaused: false } : null,
      })),

      endSession: async () => {
        const { activeSession } = get()
        if (!activeSession) return

        const session: FocusSession = {
          id: crypto.randomUUID(),
          task_id: activeSession.taskId,
          started_at: new Date(activeSession.startedAt).toISOString(),
          ended_at: new Date().toISOString(),
          duration_minutes: Math.round((activeSession.duration - activeSession.remaining) / 60),
          session_type: activeSession.type,
          created_at: new Date().toISOString(),
        }

        set((s) => ({
          activeSession: null,
          sessions: [session, ...s.sessions],
          completedPomodoros: activeSession.type === 'pomodoro'
            ? s.completedPomodoros + 1
            : s.completedPomodoros,
        }))

        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('focus_sessions').insert({
            ...session,
            user_id: user.id
          })
          if (error) console.error('Error saving focus session:', error)
        }
      },

      tick: () => set((s) => {
        if (!s.activeSession || s.activeSession.isPaused) return s
        const remaining = s.activeSession.remaining - 1
        if (remaining <= 0) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Tempo esgotado!', { body: 'Sua sessão de foco terminou.' })
          }
          setTimeout(() => get().endSession(), 0)
          return s
        }
        return { activeSession: { ...s.activeSession, remaining } }
      }),

      updateRemaining: (remaining) => set((s) => ({
        activeSession: s.activeSession ? { ...s.activeSession, remaining } : null,
      })),

      updateSettings: (settings) => set({
        pomodoroSettings: { ...get().pomodoroSettings, ...settings },
      }),
    }),
    {
      name: 'planner-focus-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        pomodoroSettings: state.pomodoroSettings,
        completedPomodoros: state.completedPomodoros,
      }),
    }
  )
)
