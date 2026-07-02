import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { getLocalTodayStr } from '@/lib/dateUtils'
import type { DailyNote } from '@/types'

interface PlanningState {
  notes: DailyNote[]
  loading: boolean
  setNotes: (notes: DailyNote[]) => void
  fetchNotes: () => Promise<void>
  addNote: (note: DailyNote) => Promise<void>
  updateNote: (id: string, updates: Partial<DailyNote>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  getNoteForDate: (date: string) => DailyNote | undefined
  ensureTodayNote: () => Promise<void>
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      notes: [],
      loading: false,

      setNotes: (notes) => set({ notes }),

      fetchNotes: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true })
        const { data, error } = await supabase
          .from('daily_notes')
          .select('*')
          .order('note_date', { ascending: false })
        
        if (!error && data) {
          set({ notes: data, loading: false })
        } else {
          set({ loading: false })
        }
      },

      addNote: async (note) => {
        set((s) => ({ notes: [note, ...s.notes] }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('daily_notes').insert({ ...note, user_id: user.id })
          if (error) console.error('Error adding daily note:', error)
        }
      },

      updateNote: async (id, updates) => {
        const updated_at = new Date().toISOString()
        set((s) => ({
          notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updated_at } : n),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('daily_notes').update({ ...updates, updated_at }).eq('id', id)
          if (error) console.error('Error updating daily note:', error)
        }
      },

      deleteNote: async (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('daily_notes').delete().eq('id', id)
          if (error) console.error('Error deleting daily note:', error)
        }
      },

      getNoteForDate: (date) => {
        return get().notes.find((n) => n.note_date === date)
      },

      ensureTodayNote: async () => {
        const today = getLocalTodayStr()
        const existing = get().notes.find((n) => n.note_date === today)
        if (existing) return

        const newNote: DailyNote = {
          id: crypto.randomUUID(),
          note_date: today,
          yesterday_review: null,
          today_priorities: [],
          notes: null,
          mood: null,
          created_at: new Date().toISOString(),
        }
        await get().addNote(newNote)
      },
    }),
    {
      name: 'planner-planning-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
)
