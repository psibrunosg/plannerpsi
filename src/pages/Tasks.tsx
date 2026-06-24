import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { List, Kanban, Calendar, GanttChart, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import type { ViewMode } from '@/types'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types'

const VIEW_OPTIONS: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'list', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
  { id: 'calendar', icon: Calendar, label: 'Calendário' },
  { id: 'timeline', icon: GanttChart, label: 'Timeline' },
]

export default function Tasks() {
  const { viewMode, setViewMode, setTaskFormOpen } = useUIStore()
  const tasks = useTaskStore((s) => s.tasks)
  const filter = useTaskStore((s) => s.filter)
  const filteredTasks = useMemo(() => useTaskStore.getState().filteredTasks(), [tasks, filter])

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Tarefas</span></h1>
          <p className="mt-1 text-text-secondary">{filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}</p>
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

      {filteredTasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Filter className="mb-4 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">Nenhuma tarefa</h3>
          <p className="mt-1 text-sm text-text-secondary">Crie sua primeira tarefa para começar</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.005, x: 2 }} onClick={() => useUIStore.getState().setTaskDetailId(task.id)}
              className="glass-card flex cursor-pointer items-center gap-4 p-4">
              <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); task.status === 'done' ? useTaskStore.getState().updateTask(task.id, { status: 'todo', completed_at: null }) : useTaskStore.getState().completeTask(task.id) }}
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
      )}
    </motion.div>
  )
}
