import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, AlertTriangle, CalendarOff, ZoomIn, ZoomOut, Target } from 'lucide-react'
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

const ZOOM_LEVELS = [
  { label: '7d', days: 7, dayWidth: 96 },
  { label: '14d', days: 14, dayWidth: 72 },
  { label: '30d', days: 30, dayWidth: 42 },
]

const MIN_BAR_DAYS = 1
const MINUTES_PER_DAY = 480 // 8h workday

const PRIORITY_BAR_COLORS: Record<string, { gradient: string; glow: string }> = {
  p1: { gradient: 'from-red-500 to-red-400', glow: 'shadow-red-500/20' },
  p2: { gradient: 'from-orange-500 to-orange-400', glow: 'shadow-orange-500/20' },
  p3: { gradient: 'from-blue-500 to-blue-400', glow: 'shadow-blue-500/20' },
  p4: { gradient: 'from-gray-500 to-gray-400', glow: 'shadow-gray-500/20' },
}

const STATUS_GROUP_ORDER: TaskStatus[] = ['in_progress', 'todo', 'backlog', 'done']

interface TooltipData {
  task: Task
  x: number
  y: number
}

interface TimelineBarProps {
  task: Task
  startDate: Date
  dayWidth: number
  visibleDays: number
  onTooltip: (data: TooltipData | null) => void
}

function TimelineBar({ task, startDate, dayWidth, visibleDays, onTooltip }: TimelineBarProps) {
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
  const clippedEnd = Math.min(visibleDays, offset + 1)
  const width = Math.max(dayWidth * 0.8, (clippedEnd - clippedStart) * dayWidth - 4)

  if (clippedEnd <= 0 || clippedStart >= visibleDays) return null

  const overdue = task.status !== 'done' && isBefore(taskDate, startOfDay(new Date()))
  const isDone = task.status === 'done'
  const pct = task.completion_percentage ?? 0
  const colors = PRIORITY_BAR_COLORS[task.priority]

  return (
    <motion.button
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={() => setTaskDetailId(task.id)}
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onTooltip({ task, x: rect.left + rect.width / 2, y: rect.top - 8 })
      }}
      onMouseLeave={() => onTooltip(null)}
      className={cn(
        'absolute top-1 flex h-7 items-center overflow-hidden rounded-md px-2 text-[11px] font-medium text-white/90 shadow-sm transition-all origin-left cursor-pointer group',
        'hover:brightness-110 hover:shadow-lg',
        isDone
          ? 'bg-gradient-to-r from-green-600/60 to-green-500/40 opacity-60'
          : cn(`bg-gradient-to-r ${colors.gradient}`, colors.glow, 'shadow-md'),
        overdue && 'ring-1 ring-danger/60',
      )}
      title={task.title}
    >
      {/* Progress fill overlay */}
      {!isDone && pct > 0 && (
        <div
          className="absolute inset-0 bg-black/20 origin-right rounded-md"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        />
      )}
      {/* Done progress fill */}
      {isDone && (
        <div className="absolute inset-0 bg-green-400/30 rounded-md" />
      )}

      {overdue && <AlertTriangle className="relative z-10 h-3 w-3 shrink-0 text-yellow-200" />}
      <span className="relative z-10 truncate">{task.title}</span>
      {pct > 0 && pct < 100 && (
        <span className="relative z-10 ml-auto shrink-0 text-[9px] opacity-80 font-bold">{pct}%</span>
      )}
    </motion.button>
  )
}

function TaskTooltip({ data }: { data: TooltipData }) {
  const { task, x, y } = data
  const pct = task.completion_percentage ?? 0
  const overdue = task.due_date && task.status !== 'done' && isBefore(startOfDay(new Date(task.due_date)), startOfDay(new Date()))
  const colors = PRIORITY_BAR_COLORS[task.priority]

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: Math.min(x, window.innerWidth - 260), top: y, transform: 'translate(-50%, -100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="w-56 rounded-[var(--radius-md)] border border-border-subtle bg-surface shadow-2xl p-3 mb-2"
      >
        {/* Priority dot + title */}
        <div className="flex items-start gap-2 mb-2">
          <div className={cn('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br', colors.gradient)} />
          <p className={cn('text-sm font-semibold text-text-primary leading-tight', task.status === 'done' && 'line-through text-text-muted')}>
            {task.title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-muted">Progresso</span>
            <span className="text-[10px] font-bold text-accent">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-success' : `bg-gradient-to-r ${colors.gradient}`)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-[11px] text-text-muted">
          <div className="flex items-center justify-between">
            <span>Prioridade</span>
            <span className={cn('font-medium', PRIORITY_CONFIG[task.priority].color)}>{PRIORITY_CONFIG[task.priority].label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className={cn('font-medium', STATUS_CONFIG[task.status].color)}>{STATUS_CONFIG[task.status].label}</span>
          </div>
          {task.due_date && (
            <div className="flex items-center justify-between">
              <span>Prazo</span>
              <span className={cn('font-medium', overdue ? 'text-danger' : 'text-text-secondary')}>
                {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
                {task.due_time && ` ${task.due_time}`}
                {overdue && ' ⚠'}
              </span>
            </div>
          )}
          {task.estimated_minutes && (
            <div className="flex items-center justify-between">
              <span>Estimativa</span>
              <span className="font-medium text-text-secondary">{task.estimated_minutes}min</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center justify-between">
              <span>Atribuído a</span>
              <span className="font-medium text-text-secondary">{task.assignee.full_name || task.assignee.email}</span>
            </div>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {task.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent/10 px-1.5 py-0.5 text-accent text-[9px]">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

interface StatusGroupProps {
  status: TaskStatus
  tasks: Task[]
  startDate: Date
  dayWidth: number
  visibleDays: number
  defaultOpen?: boolean
  onTooltip: (data: TooltipData | null) => void
}

function StatusGroup({ status, tasks, startDate, dayWidth, visibleDays, defaultOpen = true, onTooltip }: StatusGroupProps) {
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
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-text-muted text-xs">▶</motion.span>
        <span className={cn('text-xs font-semibold', config.color)}>{config.label}</span>
        <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold text-text-muted">{tasks.length}</span>
      </motion.button>

      {/* Task rows */}
      {open && (
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center">
              {/* Task label (fixed left) */}
              <div className="w-48 shrink-0 pr-3 flex items-center justify-between">
                <div className="flex-1 truncate">
                  <p className={cn('truncate text-xs font-medium', task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary')} title={task.title}>
                    {task.title}
                  </p>
                  {(task.completion_percentage ?? 0) > 0 && task.status !== 'done' && (
                    <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r', PRIORITY_BAR_COLORS[task.priority].gradient)}
                        style={{ width: `${task.completion_percentage}%` }}
                      />
                    </div>
                  )}
                </div>
                {task.assignee && (
                  <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[9px] font-bold text-accent" title={task.assignee.full_name || task.assignee.email}>
                    {(task.assignee.full_name || task.assignee.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Timeline bar area */}
              <div className="relative h-9 flex-1" style={{ minWidth: `${visibleDays * dayWidth}px` }}>
                <TimelineBar task={task} startDate={startDate} dayWidth={dayWidth} visibleDays={visibleDays} onTooltip={onTooltip} />
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
  const [zoomIndex, setZoomIndex] = useState(1) // default: 14d
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const zoom = ZOOM_LEVELS[zoomIndex]
  const { days: visibleDays, dayWidth } = zoom

  const days = useMemo(
    () => Array.from({ length: visibleDays }, (_, i) => addDays(startDate, i)),
    [startDate, visibleDays],
  )

  const tasksWithDate = useMemo(() => tasks.filter((t) => t.due_date), [tasks])
  const tasksWithoutDate = useMemo(() => tasks.filter((t) => !t.due_date), [tasks])

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], in_progress: [], done: [], archived: [],
    }
    for (const task of tasksWithDate) {
      groups[task.status].push(task)
    }
    return groups
  }, [tasksWithDate])

  const navigatePrev = useCallback(() => setStartDate((d) => subDays(d, Math.round(visibleDays / 2))), [visibleDays])
  const navigateNext = useCallback(() => setStartDate((d) => addDays(d, Math.round(visibleDays / 2))), [visibleDays])
  const navigateToday = useCallback(() => setStartDate(startOfDay(new Date())), [])

  // Today column index
  const todayOffset = differenceInDays(startOfDay(new Date()), startDate)
  const showTodayLine = todayOffset >= 0 && todayOffset < visibleDays

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="relative">
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && <TaskTooltip data={tooltip} />}
      </AnimatePresence>

      {/* Header navigation */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={navigatePrev}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <h2 className="min-w-[180px] text-center text-sm font-semibold text-text-primary">
            {format(startDate, "d MMM", { locale: ptBR })} — {format(addDays(startDate, visibleDays - 1), "d MMM yyyy", { locale: ptBR })}
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={navigateNext}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-[var(--radius-sm)] bg-surface-elevated border border-border-subtle p-1 gap-0.5">
            <button
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            {ZOOM_LEVELS.map((z, i) => (
              <button
                key={z.label}
                onClick={() => setZoomIndex(i)}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium transition-colors',
                  i === zoomIndex ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover',
                )}
              >
                {z.label}
              </button>
            ))}
            <button
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={navigateToday}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
          >
            <Target className="h-3.5 w-3.5" />
            Hoje
          </motion.button>
        </div>
      </div>

      {/* Timeline content */}
      <div className="overflow-x-auto rounded-[var(--radius-md)] glass-card">
        <div style={{ minWidth: `${192 + visibleDays * dayWidth}px` }}>
          {/* Day headers */}
          <div className="flex items-center border-b border-border-subtle sticky top-0 z-10 glass">
            <div className="w-48 shrink-0 border-r border-border-subtle px-3 py-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tarefa</span>
            </div>
            <div className="flex relative">
              {days.map((day) => {
                const today = isToday(day)
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={day.toISOString()}
                    style={{ width: `${dayWidth}px` }}
                    className={cn(
                      'flex flex-col items-center justify-center border-r border-border-subtle/30 py-2 relative',
                      today && 'bg-accent/10',
                      isWeekend && !today && 'bg-surface-hover/20',
                    )}
                  >
                    <span className={cn('text-[10px] uppercase font-medium', today ? 'text-accent' : 'text-text-muted')}>
                      {dayWidth > 50 ? format(day, 'EEE', { locale: ptBR }) : format(day, 'E', { locale: ptBR }).charAt(0)}
                    </span>
                    <span className={cn(
                      'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
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
          <motion.div className="p-3 relative" variants={staggerContainer} initial="hidden" animate="visible">
            {/* Today vertical line */}
            {showTodayLine && (
              <div
                className="absolute top-0 bottom-0 w-px bg-accent/50 pointer-events-none z-20"
                style={{ left: `${192 + todayOffset * dayWidth + dayWidth / 2}px` }}
              >
                <div className="absolute -top-0.5 -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
              </div>
            )}

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
                    visibleDays={visibleDays}
                    defaultOpen={status !== 'done'}
                    onTooltip={setTooltip}
                  />
                ))}
              </>
            )}
          </motion.div>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Sem Data Definida</h3>
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
                <div className={cn('h-1.5 w-1.5 rounded-full', task.status === 'done' ? 'bg-success' : PRIORITY_CONFIG[task.priority].bg.replace('/20', ''))} />
                {task.title}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
