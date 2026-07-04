import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { useUIStore } from '@/stores/uiStore'
import { PRIORITY_CONFIG } from '@/types'
import type { Task } from '@/types'
import { fadeIn, scaleIn } from '@/lib/motion'
import { useScrollLock } from '@/lib/useScrollLock'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function TaskPill({ task }: { task: Task }) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)
  const priorityColor = PRIORITY_CONFIG[task.priority]

  return (
    <motion.button
      whileHover={{ scale: 1.04, x: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={(e) => {
        e.stopPropagation()
        setTaskDetailId(task.id)
      }}
      className={cn(
        'w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors',
        task.status === 'done'
          ? 'bg-success/10 text-success/70 line-through'
          : cn(priorityColor.bg, priorityColor.color),
      )}
      title={task.title}
    >
      {task.title}
    </motion.button>
  )
}

interface DayPopoverProps {
  date: Date
  tasks: Task[]
  onClose: () => void
}

function DayPopover({ date, tasks, onClose }: DayPopoverProps) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)
  useScrollLock(true)

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full max-w-sm rounded-[var(--radius-lg)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {format(date, "d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-text-muted">
              {format(date, 'EEEE', { locale: ptBR })} · {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="max-h-64 overflow-y-auto p-3 space-y-1.5">
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">Nenhuma tarefa neste dia</p>
          ) : (
            tasks.map((task) => (
              <motion.button
                key={task.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  setTaskDetailId(task.id)
                  onClose()
                }}
                className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] p-2.5 text-left transition-colors hover:bg-surface-hover"
              >
                <div className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_CONFIG[task.priority].bg.replace('/20', ''))} />
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'truncate text-sm font-medium',
                    task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary',
                  )}>
                    {task.title}
                  </p>
                  {task.estimated_minutes && (
                    <p className="text-[10px] text-text-muted">{task.estimated_minutes}min estimados</p>
                  )}
                </div>
                <span className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                  PRIORITY_CONFIG[task.priority].bg,
                  PRIORITY_CONFIG[task.priority].color,
                )}>
                  {PRIORITY_CONFIG[task.priority].label}
                </span>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.due_date) continue
      const key = task.due_date.split('T')[0]
      const arr = map.get(key) ?? []
      arr.push(task)
      map.set(key, arr)
    }
    return map
  }, [tasks])

  const getTasksForDay = useCallback(
    (day: Date) => tasksByDate.get(format(day, 'yyyy-MM-dd')) ?? [],
    [tasksByDate],
  )

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : []

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* Header: month navigation */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <h2 className="min-w-[160px] text-center text-base font-semibold text-text-primary capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentMonth(new Date())}
          className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
        >
          Hoje
        </motion.button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayTasks = getTasksForDay(day)
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const hasTasks = dayTasks.length > 0

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'group relative flex min-h-[100px] flex-col rounded-[var(--radius-sm)] border p-1.5 text-left transition-all',
                inMonth ? 'border-border-subtle/50' : 'border-transparent',
                today && 'ring-2 ring-accent/40',
                !inMonth && 'opacity-30',
                hasTasks && inMonth && 'hover:border-accent/30 hover:bg-surface-hover/50',
                !hasTasks && inMonth && 'hover:bg-surface-hover/30',
              )}
            >
              {/* Day number */}
              <span className={cn(
                'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                today ? 'bg-accent text-white' : 'text-text-secondary',
              )}>
                {format(day, 'd')}
              </span>

              {/* Task pills */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <TaskPill key={task.id} task={task} />
                ))}
                {dayTasks.length > 3 && (
                  <span className="block text-[9px] font-medium text-text-muted">
                    +{dayTasks.length - 3} mais
                  </span>
                )}
              </div>

              {/* Dot indicator */}
              {hasTasks && (
                <div className="absolute bottom-1 right-1.5 flex gap-0.5">
                  {dayTasks.length <= 3 ? (
                    dayTasks.map((t) => (
                      <div key={t.id} className={cn('h-1 w-1 rounded-full', PRIORITY_CONFIG[t.priority].bg.replace('/20', '/60'))} />
                    ))
                  ) : (
                    <span className="text-[8px] font-bold text-text-muted">{dayTasks.length}</span>
                  )}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Tasks without due date notice */}
      {tasks.filter((t) => !t.due_date).length > 0 && (
        <div className="mt-4 rounded-[var(--radius-sm)] bg-surface-hover/50 px-3 py-2">
          <p className="text-xs text-text-muted">
            📌 {tasks.filter((t) => !t.due_date).length} tarefa{tasks.filter((t) => !t.due_date).length !== 1 ? 's' : ''} sem data definida
          </p>
        </div>
      )}

      {/* Day detail popover */}
      <AnimatePresence>
        {selectedDay && (
          <DayPopover
            date={selectedDay}
            tasks={selectedDayTasks}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
