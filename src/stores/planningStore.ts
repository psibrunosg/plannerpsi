import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyNote } from '@/types'

interface PlanningState {
  notes: DailyNote[]
  addNote: (note: DailyNote) => void
  updateNote: (id: string, updates: Partial<DailyNote>) => void
  deleteNote: (id: string) => void
  getNoteForDate: (date: string) => DailyNote | undefined
  ensureTodayNote: () => void
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (note) => set((s) => ({
        notes: [note, ...s.notes],
      })),

      updateNote: (id, updates) => set((s) => ({
        notes: s.notes.map((n) => n.id === id ? { ...n, ...updates } : n),
      })),

      deleteNote: (id) => set((s) => ({
        notes: s.notes.filter((n) => n.id !== id),
      })),

      getNoteForDate: (date) => {
        return get().notes.find((n) => n.note_date === date)
      },

      ensureTodayNote: () => {
        const today = new Date().toISOString().split('T')[0]
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
        set((s) => ({ notes: [newNote, ...s.notes] }))
      },
    }),
    {
      name: 'planner-planning-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
)
