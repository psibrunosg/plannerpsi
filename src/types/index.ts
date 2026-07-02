export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'archived'
export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4'
export type SessionType = 'pomodoro' | 'deep_work' | 'break'
export type Mood = 'great' | 'good' | 'okay' | 'bad'
export type DateTagId = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'future' | 'all'

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
  completion_percentage: number
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

export interface ProcedureStep {
  id: string
  title: string
  description: string | null
  order: number
}

export interface Procedure {
  id: string
  name: string
  description: string | null
  steps: ProcedureStep[]
  created_at: string
  updated_at: string
}

export interface ProcedureColumn {
  id: string
  title: string
  order: number
}

export interface FlowEdge {
  id: string
  source: string
  target: string
}

export interface FlowPosition {
  x: number
  y: number
}

// These are internal parsed structures stored inside description fields
export interface ParsedProcedureDesc {
  text: string
  columns: ProcedureColumn[]
  edges: FlowEdge[]
  viewport?: { x: number, y: number, zoom: number }
}

export interface ParsedStepDesc {
  text: string
  column_id: string
  position: FlowPosition
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  search?: string
  due_date_from?: string
  due_date_to?: string
  dateTag?: DateTagId
}

export type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline'

export interface DateTagConfig {
  id: DateTagId
  label: string
  color: string
  bg: string
  getDate: () => string | null
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  p1: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/20' },
  p2: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  p3: { label: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  p4: { label: 'Baixa', color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Pendente', color: 'text-gray-400' },
  todo: { label: 'A Fazer', color: 'text-blue-400' },
  in_progress: { label: 'Em Progresso', color: 'text-yellow-400' },
  done: { label: 'Concluído', color: 'text-green-400' },
  archived: { label: 'Arquivado', color: 'text-gray-500' },
}

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Pendente' },
  { id: 'todo', label: 'A Fazer' },
  { id: 'in_progress', label: 'Em Progresso' },
  { id: 'done', label: 'Concluído' },
]

// Helper to get Friday of this week
function getThisFriday(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day <= 5 ? 5 - day : 5 + 7 - day
  const friday = new Date(now)
  friday.setDate(now.getDate() + diff)
  friday.setHours(23, 59, 59, 999)
  return friday
}

// Helper to get next Monday
function getNextMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 1 : 8 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(9, 0, 0, 0)
  return monday
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export const SMART_DATE_TAGS: { id: string; label: string; color: string; bg: string; getDate: () => string }[] = [
  { id: 'hoje', label: 'Hoje', color: 'text-green-400', bg: 'bg-green-500/20', getDate: () => toDateStr(new Date()) },
  { id: 'amanha', label: 'Amanhã', color: 'text-blue-400', bg: 'bg-blue-500/20', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d) } },
  { id: 'semana', label: 'Restante da semana', color: 'text-yellow-400', bg: 'bg-yellow-500/20', getDate: () => toDateStr(getThisFriday()) },
  { id: 'proxima', label: 'Semana que vem', color: 'text-purple-400', bg: 'bg-purple-500/20', getDate: () => toDateStr(getNextMonday()) },
  { id: 'futuro', label: 'Futuro', color: 'text-cyan-400', bg: 'bg-cyan-500/20', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 15); return toDateStr(d) } },
]

export const DATE_FILTER_TABS: { id: DateTagId; label: string; color: string }[] = [
  { id: 'all', label: 'Todas', color: 'text-text-secondary' },
  { id: 'overdue', label: 'Atrasadas', color: 'text-red-400' },
  { id: 'today', label: 'Hoje', color: 'text-green-400' },
  { id: 'tomorrow', label: 'Amanhã', color: 'text-blue-400' },
  { id: 'this_week', label: 'Restante da semana', color: 'text-yellow-400' },
  { id: 'next_week', label: 'Semana que vem', color: 'text-purple-400' },
  { id: 'future', label: 'Futuro', color: 'text-cyan-400' },
]
