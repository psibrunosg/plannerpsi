import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Calendar, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { KANBAN_COLUMNS, PRIORITY_CONFIG } from '@/types'
import type { Task, TaskStatus } from '@/types'
import { staggerContainer, staggerItem } from '@/lib/motion'

const COLUMN_COLORS: Record<TaskStatus, { accent: string; bg: string; border: string }> = {
  backlog: { accent: 'bg-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-400/20' },
  todo: { accent: 'bg-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/20' },
  in_progress: { accent: 'bg-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/20' },
  done: { accent: 'bg-green-400', bg: 'bg-green-400/5', border: 'border-green-400/20' },
  archived: { accent: 'bg-gray-500', bg: 'bg-gray-500/5', border: 'border-gray-500/20' },
}

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  return `${diffDays}d`
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  return new Date(task.due_date) < new Date()
}

interface KanbanCardProps {
  task: Task
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

function KanbanCard({ task, onDragStart }: KanbanCardProps) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)
  const completeTask = useTaskStore((s) => s.completeTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const dueLabel = formatDueDate(task.due_date)
  const overdue = isOverdue(task)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      onClick={() => setTaskDetailId(task.id)}
      className="glass-card group cursor-grab active:cursor-grabbing p-3.5 select-none hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      {/* Grip + Priority */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            PRIORITY_CONFIG[task.priority].bg,
            PRIORITY_CONFIG[task.priority].color,
          )}>
            {PRIORITY_CONFIG[task.priority].label}
          </span>
        </div>

        {/* Complete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            task.status === 'done'
              ? updateTask(task.id, { status: 'todo', completed_at: null })
              : completeTask(task.id)
          }}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:scale-110 active:scale-95',
            task.status === 'done'
              ? 'border-success bg-success/20 text-success'
              : 'border-text-muted/40 hover:border-accent opacity-0 group-hover:opacity-100',
          )}
        >
          {task.status === 'done' && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6L5 9L10 3" />
            </svg>
          )}
        </button>
      </div>

      {/* Title */}
      <p className={cn(
        'text-sm font-medium leading-snug',
        task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary',
      )}>
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 text-xs text-text-muted line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
              {tag}
            </span>
          ))}
          {task.tags?.length > 3 && (
            <span className="text-[10px] text-text-muted">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Completion % */}
      {(task.completion_percentage ?? 0) > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
            <div
              className={cn('h-full rounded-full transition-all', task.completion_percentage === 100 ? 'bg-success' : (task.completion_percentage ?? 0) >= 50 ? 'bg-accent' : 'bg-warning')}
              style={{ width: `${task.completion_percentage ?? 0}%` }}
            />
          </div>
          <span className={cn('text-[9px] font-bold', task.completion_percentage === 100 ? 'text-success' : 'text-text-muted')}>
            {task.completion_percentage ?? 0}%
          </span>
        </div>
      )}

      {/* Footer: due date + estimated time */}
      {(dueLabel || task.estimated_minutes) && (
        <div className="mt-2.5 flex items-center gap-3 border-t border-border-subtle pt-2">
          {dueLabel && (
            <span className={cn(
              'flex items-center gap-1 text-[11px] font-medium',
              overdue ? 'text-danger' : 'text-text-muted',
            )}>
              <Calendar className="h-3 w-3" />
              {dueLabel}
            </span>
          )}
          {task.estimated_minutes && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}m
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function KanbanBoard() {
  const allTasks = useTaskStore((s) => s.tasks)
  const filter = useTaskStore((s) => s.filter)
  const tasks = useMemo(() => useTaskStore.getState().filteredTasks(), [allTasks, filter])
  const moveTask = useTaskStore((s) => s.moveTask)
  const setTaskFormOpen = useUIStore((s) => s.setTaskFormOpen)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      moveTask(taskId, columnId)
    }
    setDragOverColumn(null)
  }, [moveTask])

  const getColumnTasks = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks],
  )

  return (
    <motion.div
      className="flex gap-4 overflow-x-auto pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {KANBAN_COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.id)
        const colors = COLUMN_COLORS[column.id]
        const isDragOver = dragOverColumn === column.id

        return (
          <motion.div
            key={column.id}
            variants={staggerItem}
            className="w-72 shrink-0 flex flex-col"
            onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e as unknown as React.DragEvent, column.id)}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn('h-2.5 w-2.5 rounded-full', colors.accent)} />
                <h3 className="text-sm font-semibold text-text-primary">{column.label}</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-hover px-1.5 text-[10px] font-bold text-text-muted">
                  {columnTasks.length}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTaskFormOpen(true)}
                className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Column body */}
            <div
              className={cn(
                'flex-1 rounded-[var(--radius-md)] border-2 border-dashed p-2 transition-all duration-200 min-h-[200px]',
                isDragOver
                  ? cn(colors.border, colors.bg, 'scale-[1.01]')
                  : 'border-transparent',
              )}
            >
              <AnimatePresence mode="popLayout">
                {columnTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full min-h-[160px] items-center justify-center"
                  >
                    <p className={cn(
                      'text-xs transition-colors',
                      isDragOver ? 'text-accent font-medium' : 'text-text-muted/50',
                    )}>
                      {isDragOver ? 'Soltar aqui' : 'Arraste tarefas aqui'}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2.5">
                    {columnTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
