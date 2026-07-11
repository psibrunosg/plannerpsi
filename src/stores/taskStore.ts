import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useToastStore } from '@/stores/toastStore'
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
    assignee_id: t.assignee_id ?? null,
    assignee: t.assignee ?? undefined,
    patient_id: t.patient_id ?? null,
    patient: t.patient ?? undefined,
  }
}

interface TaskState {
  tasks: Task[]
  filter: TaskFilter
  loading: boolean
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  syncError: string | null
  setTasks: (tasks: Task[]) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  archiveCompletedTasks: () => Promise<boolean>
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
      syncStatus: 'idle',
      syncError: null,

      setTasks: (tasks) => set({ tasks }),

      fetchTasks: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true, syncStatus: 'syncing', syncError: null })
        // Resolve public profiles separately: tasks.assignee_id references auth.users,
        // so PostgREST cannot safely embed public.profiles through that relation.
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          const assigneeIds = [...new Set(data.map((task) => task.assignee_id).filter(Boolean))]
          const { data: profiles } = assigneeIds.length
            ? await supabase.from('profiles').select('id, email, full_name, level').in('id', assigneeIds)
            : { data: [] }
          const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
          const sanitized = data.map((task) => sanitizeTask({
            ...task,
            assignee: task.assignee_id ? profilesById.get(task.assignee_id) : undefined,
          }))
          
          set({ tasks: sanitized, loading: false, syncStatus: 'synced' })
        } else {
          const message = error?.message ?? 'Não foi possível carregar as tarefas.'
          set({ loading: false, syncStatus: 'error', syncError: message })
          useToastStore.getState().addToast('As tarefas locais foram mantidas. A sincronização falhou.', 'error', 6000)
        }
      },

      addTask: async (task) => {
        const user = useAuthStore.getState().user
        const taskWithUser = { ...task, user_id: user?.id || null }
        const previousTasks = get().tasks
        set({ tasks: [taskWithUser, ...previousTasks], syncStatus: user ? 'syncing' : 'idle', syncError: null })
        
        if (user) {
          const { data, error } = await supabase.from('tasks').insert(taskWithUser).select('id').single()
          if (error || !data) {
            set({ tasks: previousTasks, syncStatus: 'error', syncError: error?.message ?? 'A operaÃ§Ã£o nÃ£o retornou confirmaÃ§Ã£o.' })
            useToastStore.getState().addToast('A tarefa não foi salva na nuvem e foi desfeita.', 'error', 6000)
          } else {
            set({ syncStatus: 'synced' })
          }
        }
      },

      updateTask: async (id, updates) => {
        const updated_at = new Date().toISOString()
        const previousTasks = get().tasks
        const currentTask = previousTasks.find((task) => task.id === id)
        set({
          tasks: previousTasks.map((t) => t.id === id ? { ...t, ...updates, updated_at } : t),
          syncStatus: 'syncing', syncError: null,
        })
        
        const user = useAuthStore.getState().user
        if (user) {
          const updateKeys = Object.keys(updates).filter((key) => key !== 'updated_at')
          const isDelegateProgressUpdate = currentTask?.assignee_id === user.id
            && currentTask.user_id !== user.id
            && updateKeys.every((key) => ['status', 'completion_percentage', 'actual_minutes', 'completed_at', 'kanban_column'].includes(key))

          const result = isDelegateProgressUpdate
            ? await supabase.rpc('update_delegated_task_progress', {
              p_task_id: id,
              p_status: updates.status ?? null,
              p_completion_percentage: updates.completion_percentage ?? null,
              p_actual_minutes: updates.actual_minutes ?? null,
            })
            : await supabase.from('tasks').update({ ...updates, updated_at }).eq('id', id).select('id').single()
          const { data, error } = result
          if (error || !data) {
            set({ tasks: previousTasks, syncStatus: 'error', syncError: error?.message ?? 'A operaÃ§Ã£o nÃ£o retornou confirmaÃ§Ã£o.' })
            useToastStore.getState().addToast('A alteração não foi salva na nuvem e foi desfeita.', 'error', 6000)
          } else {
            if (isDelegateProgressUpdate) {
              set((state) => ({ tasks: state.tasks.map((task) => task.id === id ? sanitizeTask(data) : task) }))
            }
            set({ syncStatus: 'synced' })
          }
        }
        return get().syncStatus !== 'error'
      },

      deleteTask: async (id) => {
        const previousTasks = get().tasks
        set({ tasks: previousTasks.filter((t) => t.id !== id), syncStatus: 'syncing', syncError: null })
        const user = useAuthStore.getState().user
        if (user) {
          const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id').single()
          if (error || !data) {
            set({ tasks: previousTasks, syncStatus: 'error', syncError: error?.message ?? 'A operaÃ§Ã£o nÃ£o retornou confirmaÃ§Ã£o.' })
            useToastStore.getState().addToast('A exclusão não foi salva na nuvem e foi desfeita.', 'error', 6000)
          } else {
            set({ syncStatus: 'synced' })
          }
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

        const saved = await get().updateTask(id, updates)

        if (isCompleting && saved) {
          useGamificationStore.getState().addXP(10, 'Tarefa concluída')
        }

        if (isCompleting && saved && task.is_recurring && task.recurrence_rule) {
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
        const user = useAuthStore.getState().user
        const completedTasks = get().tasks.filter((task) =>
          task.status === 'done' && (!user || task.user_id === user.id)
        )
        const previousTasks = get().tasks
        if (completedTasks.length === 0) return true

        const updates = { status: 'archived' as const, kanban_column: 'archived' as const, updated_at: new Date().toISOString() }
        const ids = completedTasks.map((task) => task.id)
        const idSet = new Set(ids)
        set({
          tasks: previousTasks.map((task) => idSet.has(task.id) ? { ...task, ...updates } : task),
          syncStatus: user ? 'syncing' : 'idle',
          syncError: null,
        })

        if (!user) return true
        const { data, error } = await supabase.from('tasks').update(updates).in('id', ids).select('id')
        if (error || !data || data.length !== ids.length) {
          set({ tasks: previousTasks, syncStatus: 'error', syncError: error?.message ?? 'Nem todas as tarefas foram confirmadas.' })
          useToastStore.getState().addToast('As tarefas n\u00e3o foram arquivadas na nuvem e a altera\u00e7\u00e3o foi desfeita.', 'error', 6000)
          return false
        }
        set({ syncStatus: 'synced' })
        return true
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

        const saved = await get().updateTask(id, updates)

        if (isCompleting && saved) {
          useGamificationStore.getState().addXP(10, 'Tarefa concluída')
        }

        if (isCompleting && saved && task.is_recurring && task.recurrence_rule) {
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
