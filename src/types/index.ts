export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'archived'
export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4'
export type SessionType = 'pomodoro' | 'deep_work' | 'break'
export type Mood = 'great' | 'good' | 'okay' | 'bad'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_minutes: number | null
  actual_minutes: number | null
  parent_id: string | null
  tags: string[]
  is_recurring: boolean
  recurrence_rule: Record<string, unknown> | null
  completed_at: string | null
  position: number
  kanban_column: string
  created_at: string
  updated_at: string
  user_id: string | null
  subtasks?: Task[]
}

export interface FocusSession {
  id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  session_type: SessionType
  created_at: string
}

export interface DailyNote {
  id: string
  note_date: string
  yesterday_review: string | null
  today_priorities: string[]
  notes: string | null
  mood: Mood | null
  created_at: string
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  search?: string
  due_date_from?: string
  due_date_to?: string
}

export type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline'

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  p1: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/20' },
  p2: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  p3: { label: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  p4: { label: 'Baixa', color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'text-gray-400' },
  todo: { label: 'A Fazer', color: 'text-blue-400' },
  in_progress: { label: 'Em Progresso', color: 'text-yellow-400' },
  done: { label: 'Concluído', color: 'text-green-400' },
  archived: { label: 'Arquivado', color: 'text-gray-500' },
}

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'A Fazer' },
  { id: 'in_progress', label: 'Em Progresso' },
  { id: 'done', label: 'Concluído' },
]
