import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { List, Kanban, Calendar, GanttChart, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import type { ViewMode, DateTagId, Task } from '@/types'
import { PRIORITY_CONFIG, STATUS_CONFIG, DATE_FILTER_TABS } from '@/types'
import { KanbanBoard } from '@/components/views/KanbanBoard'
import { CalendarView } from '@/components/views/CalendarView'
import { TimelineView } from '@/components/views/TimelineView'

const VIEW_OPTIONS: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'list', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
  { id: 'calendar', icon: Calendar, label: 'Calendário' },
  { id: 'timeline', icon: GanttChart, label: 'Timeline' },
]

function getDateOnly(iso: string): string {
  return iso.split('T')[0]
}

function filterByDateTag(tasks: Task[], tag: DateTagId): Task[] {
  if (tag === 'all') return tasks

  const now = new Date()
  const todayStr = getDateOnly(now.toISOString())

  // Get this Friday
  const day = now.getDay()
  const friday = new Date(now)
  friday.setDate(now.getDate() + (day <= 5 ? 5 - day : 5 + 7 - day))
  const fridayStr = getDateOnly(friday.toISOString())

  // Get next Monday + Friday
  const nextMon = new Date(now)
  nextMon.setDate(now.getDate() + (day === 0 ? 1 : 8 - day))
  const nextMonStr = getDateOnly(nextMon.toISOString())
  const nextFri = new Date(nextMon)
  nextFri.setDate(nextMon.getDate() + 4)
  const nextFriStr = getDateOnly(nextFri.toISOString())

  // Tomorrow
  const tmrw = new Date(now)
  tmrw.setDate(now.getDate() + 1)
  const tmrwStr = getDateOnly(tmrw.toISOString())

  switch (tag) {
    case 'overdue':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) < todayStr && t.status !== 'done')
    case 'today':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) === todayStr)
    case 'tomorrow':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) === tmrwStr)
    case 'this_week':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) > todayStr && getDateOnly(t.due_date) <= fridayStr)
    case 'next_week':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) >= nextMonStr && getDateOnly(t.due_date) <= nextFriStr)
    case 'future':
      return tasks.filter((t) => t.due_date && getDateOnly(t.due_date) > nextFriStr)
    default:
      return tasks
  }
}

function CompletionBar({ percentage }: { percentage: number }) {
  if (percentage === 0) return null
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            percentage === 100 ? 'bg-success' : percentage >= 50 ? 'bg-accent' : 'bg-warning',
          )}
        />
      </div>
      <span className={cn(
        'text-[10px] font-bold',
        percentage === 100 ? 'text-success' : percentage >= 50 ? 'text-accent' : 'text-warning',
      )}>
        {percentage}%
      </span>
    </div>
  )
}

function ListView() {
  const tasks = useTaskStore((s) => s.tasks)
  const filter = useTaskStore((s) => s.filter)
  const filteredTasks = useMemo(() => useTaskStore.getState().filteredTasks(), [tasks, filter])

  if (filteredTasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <Filter className="mb-4 h-12 w-12 text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary">Nenhuma tarefa</h3>
        <p className="mt-1 text-sm text-text-secondary">Crie sua primeira tarefa para começar</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredTasks.map((task) => (
        <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005, x: 2 }} onClick={() => useUIStore.getState().setTaskDetailId(task.id)}
          className="glass-card flex cursor-pointer items-center gap-4 p-4">
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); task.status === 'done' ? useTaskStore.getState().updateTask(task.id, { status: 'todo', completed_at: null, completion_percentage: 0 }) : useTaskStore.getState().completeTask(task.id) }}
            className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              task.status === 'done' ? 'border-success bg-success/20 text-success' : 'border-text-muted hover:border-accent')}>
            {task.status === 'done' && (
              <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }}
                className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <motion.path d="M2 6L5 9L10 3" />
              </motion.svg>
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary')}>{task.title}</p>
            {task.description && <p className="mt-0.5 text-xs text-text-muted truncate">{task.description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CompletionBar percentage={task.completion_percentage} />
            {task.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{tag}</span>
            ))}
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>
              {PRIORITY_CONFIG[task.priority].label}
            </span>
            <span className={cn('text-xs', STATUS_CONFIG[task.status].color)}>{STATUS_CONFIG[task.status].label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const VIEW_COMPONENTS: Record<ViewMode, React.FC> = {
  list: ListView,
  kanban: KanbanBoard,
  calendar: CalendarView,
  timeline: TimelineView,
}

export default function Tasks() {
  const { viewMode, setViewMode, setTaskFormOpen } = useUIStore()
  const tasks = useTaskStore((s) => s.tasks)
  const filter = useTaskStore((s) => s.filter)
  const filteredTasks = useMemo(() => useTaskStore.getState().filteredTasks(), [tasks, filter])
  const [activeDateTag, setActiveDateTag] = useState<DateTagId>('all')

  const dateFilteredTasks = useMemo(
    () => filterByDateTag(filteredTasks, activeDateTag),
    [filteredTasks, activeDateTag],
  )

  // Count tasks per date category
  const counts = useMemo(() => {
    const result: Record<DateTagId, number> = { all: filteredTasks.length, overdue: 0, today: 0, tomorrow: 0, this_week: 0, next_week: 0, future: 0 }
    for (const tag of DATE_FILTER_TABS) {
      if (tag.id !== 'all') result[tag.id] = filterByDateTag(filteredTasks, tag.id).length
    }
    return result
  }, [filteredTasks])

  const ActiveView = VIEW_COMPONENTS[viewMode]

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Tarefas</span></h1>
          <p className="mt-1 text-text-secondary">
            {activeDateTag === 'all'
              ? `${filteredTasks.length} tarefa${filteredTasks.length !== 1 ? 's' : ''}`
              : `${dateFilteredTasks.length} de ${filteredTasks.length} tarefas`
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-[var(--radius-sm)] bg-surface-elevated p-1">
            {VIEW_OPTIONS.map((opt) => (
              <motion.button key={opt.id} whileTap={{ scale: 0.95 }} onClick={() => setViewMode(opt.id)}
                className={cn('flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === opt.id ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary')}>
                <opt.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </motion.button>
            ))}
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setTaskFormOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </motion.button>
        </div>
      </div>

      {/* Date filter tabs bar */}
      <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-surface-elevated/60 p-1.5">
        {DATE_FILTER_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDateTag(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-medium transition-all',
              activeDateTag === tab.id
                ? cn('bg-surface-active', tab.color)
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/50',
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none',
                activeDateTag === tab.id ? 'bg-white/10' : 'bg-surface-hover',
                tab.id === 'overdue' && counts[tab.id] > 0 && 'bg-red-500/20 text-red-400',
              )}>
                {counts[tab.id]}
              </span>
            )}
            {activeDateTag === tab.id && (
              <motion.div
                layoutId="date-tab-indicator"
                className="absolute inset-0 rounded-[var(--radius-sm)] border border-border/50"
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      <ActiveView />
    </motion.div>
  )
}
