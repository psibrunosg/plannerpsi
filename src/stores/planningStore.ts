import { create } from 'zustand'
import type { DailyNote } from '@/types'

interface PlanningState {
  notes: DailyNote[]
  addNote: (note: DailyNote) => void
  updateNote: (id: string, updates: Partial<DailyNote>) => void
  deleteNote: (id: string) => void
  getNoteForDate: (date: string) => DailyNote | undefined
  getOrCreateToday: () => DailyNote
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
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

  getOrCreateToday: () => {
    const today = new Date().toISOString().split('T')[0]
    const existing = get().notes.find((n) => n.note_date === today)
    if (existing) return existing

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
    return newNote
  },
}))
