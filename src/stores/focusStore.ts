import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useGamificationStore } from '@/stores/gamificationStore'
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
  loadPreferencesFromDB: () => Promise<void>
  startSession: (taskId: string | null, type: SessionType, durationMinutes: number) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => Promise<void>
  logSession: (startedAt: Date, endedAt: Date, type: SessionType) => Promise<void>
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

      loadPreferencesFromDB: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('pomodoro_settings, completed_pomodoros_total')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          set({
            pomodoroSettings: {
              ...get().pomodoroSettings,
              ...(data.pomodoro_settings || {})
            },
            completedPomodoros: data.completed_pomodoros_total || 0
          })
        }
      },

      fetchSessions: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true })
        
        // Fetch recent sessions
        const { data, error } = await supabase
          .from('focus_sessions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50)
          
        if (!error && data) {
          set({ sessions: data, loading: false })
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
        const { activeSession, completedPomodoros } = get()
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

        const newCompletedPomodoros = activeSession.type === 'pomodoro'
          ? completedPomodoros + 1
          : completedPomodoros

        set((s) => ({
          activeSession: null,
          sessions: [session, ...s.sessions],
          completedPomodoros: newCompletedPomodoros,
        }))

        // Reward XP
        const xpAmount = activeSession.type === 'pomodoro' ? 30 : 20
        const xpReason = activeSession.type === 'pomodoro' ? 'Pomodoro concluído' : 'Sessão de foco concluída'
        useGamificationStore.getState().addXP(xpAmount, xpReason)

        const user = useAuthStore.getState().user
        if (user) {
          // Save session
          const { error: sessionError } = await supabase.from('focus_sessions').insert({
            ...session,
            user_id: user.id
          })
          if (sessionError) console.error('Error saving focus session:', sessionError)

          // Sync total pomodoros
          if (activeSession.type === 'pomodoro') {
            await supabase
              .from('user_preferences')
              .upsert({ 
                user_id: user.id, 
                completed_pomodoros_total: newCompletedPomodoros,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })
          }
        }
      },

      // Logs a completed session without touching activeSession — used to auto-register
      // lesson playback time as focus time, independent of the manual pomodoro timer.
      logSession: async (startedAt, endedAt, type) => {
        const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
        if (durationMinutes <= 0) return

        const session: FocusSession = {
          id: crypto.randomUUID(),
          task_id: null,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          session_type: type,
          created_at: new Date().toISOString(),
        }

        set((s) => ({ sessions: [session, ...s.sessions] }))

        useGamificationStore.getState().addXP(15, 'Sessão de estudo registrada')

        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('focus_sessions').insert({ ...session, user_id: user.id })
          if (error) console.error('Error logging study session:', error)
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

      updateSettings: async (settings) => {
        const newSettings = { ...get().pomodoroSettings, ...settings }
        set({ pomodoroSettings: newSettings })
        
        const user = useAuthStore.getState().user
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({ 
              user_id: user.id, 
              pomodoro_settings: newSettings,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
        }
      },
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
