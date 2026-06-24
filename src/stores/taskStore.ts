import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskFilter, TaskStatus, TaskPriority } from '@/types'

interface TaskState {
  tasks: Task[]
  filter: TaskFilter
  loading: boolean
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus, position?: number) => void
  setFilter: (filter: Partial<TaskFilter>) => void
  clearFilter: () => void
  setLoading: (loading: boolean) => void
  filteredTasks: () => Task[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
  tasks: [],
  filter: {},
  loading: false,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t),
  })),

  deleteTask: (id) => set((s) => ({
    tasks: s.tasks.filter((t) => t.id !== id),
  })),

  completeTask: (id) => set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === id
        ? { ...t, status: 'done' as TaskStatus, completed_at: new Date().toISOString(), completion_percentage: 100, updated_at: new Date().toISOString() }
        : t
    ),
  })),

  moveTask: (id, status, position) => set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === id
        ? { ...t, status, kanban_column: status, position: position ?? t.position, updated_at: new Date().toISOString() }
        : t
    ),
  })),

  setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),
  clearFilter: () => set({ filter: {} }),
  setLoading: (loading) => set({ loading }),

  filteredTasks: () => {
    const { tasks, filter } = get()
    let result = tasks.filter((t) => t.status !== 'archived')

    if (filter.status?.length) {
      result = result.filter((t) => filter.status!.includes(t.status))
    }
    if (filter.priority?.length) {
      result = result.filter((t) => filter.priority!.includes(t.priority))
    }
    if (filter.tags?.length) {
      result = result.filter((t) => t.tags?.some((tag) => filter.tags!.includes(tag)))
    }
    if (filter.search) {
      const q = filter.search.toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => {
      const priorityOrder: Record<TaskPriority, number> = { p1: 0, p2: 1, p3: 2, p4: 3 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.position - b.position
    })
  },
}),
    {
      name: 'planner-tasks-storage',
    }
  )
)
