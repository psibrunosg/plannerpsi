import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useGamificationStore } from '@/stores/gamificationStore'
import type { Task, TaskFilter, TaskStatus, TaskPriority } from '@/types'

function getNextDueDate(dueDateISO: string, rule: Task['recurrence_rule']): string {
  const next = new Date(dueDateISO)
  if (!rule) return next.toISOString()

  switch (rule.freq) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval)
      break
    case 'weekly':
      next.setDate(next.getDate() + rule.interval * 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + rule.interval)
      break
  }
  return next.toISOString()
}

// Helper: ensure a task loaded from localStorage has all required fields
function sanitizeTask(t: any): Task {
  return {
    id: t.id ?? crypto.randomUUID(),
    title: t.title ?? 'Sem título',
    description: t.description ?? null,
    status: t.status ?? 'todo',
    priority: t.priority ?? 'p3',
    due_date: t.due_date ?? null,
    due_time: t.due_time ?? null,
    reminder_minutes: t.reminder_minutes ?? null,
    estimated_minutes: t.estimated_minutes ?? null,
    actual_minutes: t.actual_minutes ?? null,
    parent_id: t.parent_id ?? null,
    tags: Array.isArray(t.tags) ? t.tags : [],
    is_recurring: t.is_recurring ?? false,
    recurrence_rule: t.recurrence_rule ?? null,
    completed_at: t.completed_at ?? null,
    position: t.position ?? 0,
    kanban_column: t.kanban_column ?? t.status ?? 'todo',
    completion_percentage: t.completion_percentage ?? 0,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.updated_at ?? new Date().toISOString(),
    user_id: t.user_id ?? null,
  }
}

interface TaskState {
  tasks: Task[]
  filter: TaskFilter
  loading: boolean
  setTasks: (tasks: Task[]) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  archiveCompletedTasks: () => Promise<void>
  moveTask: (id: string, status: TaskStatus, position?: number) => Promise<void>
  setFilter: (filter: Partial<TaskFilter>) => void
  clearFilter: () => void
  setLoading: (loading: boolean) => void
  filteredTasks: () => Task[]
  archivedTasks: () => Task[]
  getAllTags: () => string[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filter: {},
      loading: false,

      setTasks: (tasks) => set({ tasks }),

      fetchTasks: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true })
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          set({ tasks: data.map(sanitizeTask), loading: false })
        } else {
          set({ loading: false })
        }
      },

      addTask: async (task) => {
        const user = useAuthStore.getState().user
        const taskWithUser = { ...task, user_id: user?.id || null }
        set((s) => ({ tasks: [taskWithUser, ...s.tasks] }))
        
        if (user) {
          const { error } = await supabase.from('tasks').insert(taskWithUser)
          if (error) console.error('Error adding task to Supabase:', error)
        }
      },

      updateTask: async (id, updates) => {
        const updated_at = new Date().toISOString()
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates, updated_at } : t),
        }))
        
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('tasks').update({ ...updates, updated_at }).eq('id', id)
          if (error) console.error('Error updating task:', error)
        }
      },

      deleteTask: async (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('tasks').delete().eq('id', id)
          if (error) console.error('Error deleting task:', error)
        }
      },

      completeTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return

        const isCompleting = task.status !== 'done'
        const updates: Partial<Task> = {
          status: isCompleting ? 'done' : 'todo',
          kanban_column: isCompleting ? 'done' : 'todo',
          completed_at: isCompleting ? new Date().toISOString() : null,
          completion_percentage: isCompleting ? 100 : 0,
        }

        await get().updateTask(id, updates)

        if (isCompleting) {
          useGamificationStore.getState().addXP(10, 'Tarefa concluída')
        }

        if (isCompleting && task.is_recurring && task.recurrence_rule) {
          await get().addTask({
            ...task,
            id: crypto.randomUUID(),
            due_date: getNextDueDate(task.due_date ?? new Date().toISOString(), task.recurrence_rule),
            status: 'todo',
            kanban_column: 'todo',
            completed_at: null,
            completion_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      },

      archiveCompletedTasks: async () => {
        const completedTasks = get().tasks.filter((t) => t.status === 'done')
        for (const task of completedTasks) {
          await get().updateTask(task.id, { 
            status: 'archived',
            kanban_column: 'archived'
          })
        }
      },

      moveTask: async (id, status, position) => {
        const tasks = [...get().tasks]
        const taskIndex = tasks.findIndex(t => t.id === id)
        if (taskIndex === -1) return

        const task = tasks[taskIndex]
        const isCompleting = status === 'done' && task.status !== 'done'
        
        const updates: Partial<Task> = {
          status,
          kanban_column: status,
          position: position ?? task.position,
        }

        if (isCompleting) {
          updates.completed_at = new Date().toISOString()
          updates.completion_percentage = 100
        } else if (status !== 'done') {
          updates.completed_at = null
        }

        await get().updateTask(id, updates)

        if (isCompleting) {
          useGamificationStore.getState().addXP(10, 'Tarefa concluída')
        }

        if (isCompleting && task.is_recurring && task.recurrence_rule) {
          await get().addTask({
            ...task,
            id: crypto.randomUUID(),
            due_date: getNextDueDate(task.due_date ?? new Date().toISOString(), task.recurrence_rule),
            status: 'todo',
            kanban_column: 'todo',
            completed_at: null,
            completion_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      },

      setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),
      clearFilter: () => set({ filter: {} }),
      setLoading: (loading) => set({ loading }),

      filteredTasks: () => {
        const { tasks, filter } = get()
        let result = (tasks || []).filter((t) => t.status !== 'archived')

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
            t.title?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
          )
        }

        return result.sort((a, b) => {
          const priorityOrder: Record<TaskPriority, number> = { p1: 0, p2: 1, p3: 2, p4: 3 }
          const pa = priorityOrder[a.priority] ?? 3
          const pb = priorityOrder[b.priority] ?? 3
          if (pa !== pb) return pa - pb
          return (a.position ?? 0) - (b.position ?? 0)
        })
      },

      archivedTasks: () => {
        return (get().tasks || []).filter((t) => t.status === 'archived').sort((a, b) => {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })
      },

      getAllTags: () => {
        const all = (get().tasks || []).flatMap((t) => t.tags || [])
        return [...new Set(all)].sort()
      },
    }),
    {
      name: 'planner-tasks-storage',
      partialize: (state) => ({ tasks: state.tasks }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        tasks: ((persistedState as any)?.tasks || []).map(sanitizeTask),
      }),
    }
  )
)
