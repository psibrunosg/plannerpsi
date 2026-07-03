import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CalendarOff } from 'lucide-react'
import {
  addDays,
  subDays,
  format,
  differenceInDays,
  isToday,
  startOfDay,
  isBefore,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { useUIStore } from '@/stores/uiStore'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types'
import type { Task, TaskStatus } from '@/types'
import { fadeIn, staggerContainer, staggerItem } from '@/lib/motion'

const VISIBLE_DAYS = 14
const MIN_BAR_DAYS = 1
const MINUTES_PER_DAY = 480 // 8h workday

const PRIORITY_BAR_COLORS: Record<string, string> = {
  p1: 'bg-gradient-to-r from-red-500/80 to-red-400/60',
  p2: 'bg-gradient-to-r from-orange-500/80 to-orange-400/60',
  p3: 'bg-gradient-to-r from-blue-500/80 to-blue-400/60',
  p4: 'bg-gradient-to-r from-gray-500/80 to-gray-400/60',
}

const STATUS_GROUP_ORDER: TaskStatus[] = ['in_progress', 'todo', 'backlog', 'done']

interface TimelineBarProps {
  task: Task
  startDate: Date
  dayWidth: number
}

function TimelineBar({ task, startDate, dayWidth }: TimelineBarProps) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)

  if (!task.due_date) return null

  const taskDate = startOfDay(new Date(task.due_date))
  const offset = differenceInDays(taskDate, startDate)
  const barDays = task.estimated_minutes
    ? Math.max(MIN_BAR_DAYS, Math.ceil(task.estimated_minutes / MINUTES_PER_DAY))
    : MIN_BAR_DAYS

  // Position: bar ends at due_date, starts barDays before
  const barStart = offset - barDays + 1
  const left = Math.max(0, barStart * dayWidth)
  const clippedStart = Math.max(0, barStart)
  const clippedEnd = Math.min(VISIBLE_DAYS, offset + 1)
  const width = Math.max(dayWidth * 0.8, (clippedEnd - clippedStart) * dayWidth - 4)

  if (clippedEnd <= 0 || clippedStart >= VISIBLE_DAYS) return null

  const overdue = task.status !== 'done' && isBefore(taskDate, startOfDay(new Date()))

  return (
    <motion.button
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      onClick={() => setTaskDetailId(task.id)}
      className={cn(
        'absolute top-1 flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-white/90 shadow-sm transition-all origin-left',
        'hover:brightness-110 hover:shadow-md cursor-pointer',
        task.status === 'done' ? 'bg-gradient-to-r from-green-500/60 to-green-400/40 line-through opacity-60' : PRIORITY_BAR_COLORS[task.priority],
        overdue && 'ring-1 ring-danger/60',
      )}
      title={`${task.title}${task.estimated_minutes ? ` · ${task.estimated_minutes}min` : ''}`}
    >
      {overdue && <AlertTriangle className="h-3 w-3 shrink-0 text-danger" />}
      <span className="truncate">{task.title}</span>
      {task.estimated_minutes && (
        <span className="ml-auto shrink-0 flex items-center gap-0.5 text-[9px] opacity-70">
          <Clock className="h-2.5 w-2.5" />
          {task.estimated_minutes}m
        </span>
      )}
    </motion.button>
  )
}

interface StatusGroupProps {
  status: TaskStatus
  tasks: Task[]
  startDate: Date
  dayWidth: number
  defaultOpen?: boolean
}

function StatusGroup({ status, tasks, startDate, dayWidth, defaultOpen = true }: StatusGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const config = STATUS_CONFIG[status]

  if (tasks.length === 0) return null

  return (
    <motion.div variants={staggerItem} className="mb-4">
      {/* Group header */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-hover/50 w-full"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          className="text-text-muted text-xs"
        >
          ▶
        </motion.span>
        <span className={cn('text-xs font-semibold', config.color)}>
          {config.label}
        </span>
        <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
          {tasks.length}
        </span>
      </motion.button>

      {/* Task rows */}
      {open && (
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center">
              {/* Task label (fixed left) */}
              <div className="w-48 shrink-0 pr-3">
                <p className={cn(
                  'truncate text-xs font-medium',
                  task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary',
                )}>
                  {task.title}
                </p>
              </div>

              {/* Timeline bar area */}
              <div className="relative h-9 flex-1" style={{ minWidth: `${VISIBLE_DAYS * dayWidth}px` }}>
                <TimelineBar task={task} startDate={startDate} dayWidth={dayWidth} />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function TimelineView({ tasks }: { tasks: Task[] }) {
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()))
  const dayWidth = 72

  const days = useMemo(
    () => Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(startDate, i)),
    [startDate],
  )

  const tasksWithDate = useMemo(
    () => tasks.filter((t) => t.due_date),
    [tasks],
  )

  const tasksWithoutDate = useMemo(
    () => tasks.filter((t) => !t.due_date),
    [tasks],
  )

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
      archived: [],
    }
    for (const task of tasksWithDate) {
      groups[task.status].push(task)
    }
    return groups
  }, [tasksWithDate])

  const navigatePrev = useCallback(() => setStartDate((d) => subDays(d, 7)), [])
  const navigateNext = useCallback(() => setStartDate((d) => addDays(d, 7)), [])
  const navigateToday = useCallback(() => setStartDate(startOfDay(new Date())), [])

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* Header navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={navigatePrev}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <h2 className="min-w-[200px] text-center text-sm font-semibold text-text-primary">
            {format(startDate, "d MMM", { locale: ptBR })} — {format(addDays(startDate, VISIBLE_DAYS - 1), "d MMM yyyy", { locale: ptBR })}
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={navigateNext}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={navigateToday}
          className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
        >
          Hoje
        </motion.button>
      </div>

      {/* Timeline content */}
      <div className="overflow-x-auto rounded-[var(--radius-md)] glass-card">
        <div style={{ minWidth: `${48 * 4 + VISIBLE_DAYS * dayWidth}px` }}>
          {/* Day headers */}
          <div className="flex items-center border-b border-border-subtle sticky top-0 z-10 glass">
            <div className="w-48 shrink-0 border-r border-border-subtle px-3 py-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tarefa</span>
            </div>
            <div className="flex">
              {days.map((day) => {
                const today = isToday(day)
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={day.toISOString()}
                    style={{ width: `${dayWidth}px` }}
                    className={cn(
                      'flex flex-col items-center justify-center border-r border-border-subtle/30 py-2',
                      today && 'bg-accent/10',
                      isWeekend && !today && 'bg-surface-hover/30',
                    )}
                  >
                    <span className={cn(
                      'text-[10px] uppercase font-medium',
                      today ? 'text-accent' : 'text-text-muted',
                    )}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      today ? 'bg-accent text-white' : 'text-text-secondary',
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task rows grouped by status */}
          <motion.div className="p-3" variants={staggerContainer} initial="hidden" animate="visible">
            {tasksWithDate.length === 0 && tasksWithoutDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarOff className="mb-3 h-10 w-10 text-text-muted/40" />
                <p className="text-sm text-text-muted">Nenhuma tarefa para exibir</p>
                <p className="mt-1 text-xs text-text-muted/60">Crie tarefas com datas para visualizar na timeline</p>
              </div>
            ) : (
              <>
                {STATUS_GROUP_ORDER.map((status) => (
                  <StatusGroup
                    key={status}
                    status={status}
                    tasks={groupedTasks[status]}
                    startDate={startDate}
                    dayWidth={dayWidth}
                    defaultOpen={status !== 'done'}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Today marker line */}
          {days.some((d) => isToday(d)) && (
            <div
              className="absolute top-0 bottom-0 w-px bg-accent/40 pointer-events-none z-20"
              style={{
                left: `${48 * 4 + differenceInDays(startOfDay(new Date()), startDate) * dayWidth + dayWidth / 2}px`,
              }}
            />
          )}
        </div>
      </div>

      {/* Tasks without date */}
      {tasksWithoutDate.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 glass-card p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-text-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Sem Data Definida
            </h3>
            <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
              {tasksWithoutDate.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasksWithoutDate.map((task) => (
              <motion.button
                key={task.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => useUIStore.getState().setTaskDetailId(task.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  task.status === 'done'
                    ? 'bg-success/10 text-success/70 line-through'
                    : cn(PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color, 'hover:brightness-110'),
                )}
              >
                <div className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  task.status === 'done' ? 'bg-success' : PRIORITY_CONFIG[task.priority].bg.replace('/20', ''),
                )} />
                {task.title}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
