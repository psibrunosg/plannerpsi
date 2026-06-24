import { create } from 'zustand'
import type { ViewMode } from '@/types'

interface UIState {
  sidebarExpanded: boolean
  commandPaletteOpen: boolean
  theme: 'dark' | 'light'
  viewMode: ViewMode
  taskFormOpen: boolean
  taskDetailId: string | null
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  setTaskFormOpen: (open: boolean) => void
  setTaskDetailId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarExpanded: true,
  commandPaletteOpen: false,
  theme: (localStorage.getItem('planner-theme') as 'dark' | 'light') ?? 'dark',
  viewMode: (localStorage.getItem('planner-view') as ViewMode) ?? 'list',
  taskFormOpen: false,
  taskDetailId: null,

  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem('planner-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('planner-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    return { theme: next }
  }),
  setViewMode: (mode) => {
    localStorage.setItem('planner-view', mode)
    set({ viewMode: mode })
  },
  setTaskFormOpen: (open) => set({ taskFormOpen: open }),
  setTaskDetailId: (id) => set({ taskDetailId: id }),
}))
