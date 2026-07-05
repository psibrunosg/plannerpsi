import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Flame, Clock, BookOpen } from 'lucide-react'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useFocusStore } from '@/stores/focusStore'
import { useStudyStore } from '@/stores/studyStore'
import { computeStudyStreak, buildHeatmap, buildWeeklyHours, computeModuleProgress } from '@/lib/studyStats'
import { cn } from '@/lib/cn'

const HEATMAP_WEEKS = 12
const BAR_WEEKS = 8
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function heatColor(minutes: number): string {
  if (minutes <= 0) return 'bg-surface-hover'
  if (minutes < 30) return 'bg-accent/25'
  if (minutes < 60) return 'bg-accent/50'
  if (minutes < 120) return 'bg-accent/75'
  return 'bg-accent'
}

export default function Stats() {
  const sessions = useFocusStore((s) => s.sessions)
  const { modules, activeCourseId, completedLessons, loadModules } = useStudyStore()
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const streak = useMemo(() => computeStudyStreak(sessions), [sessions])
  const heatmap = useMemo(() => buildHeatmap(sessions, HEATMAP_WEEKS), [sessions])
  const weeklyHours = useMemo(() => buildWeeklyHours(sessions, BAR_WEEKS), [sessions])
  const moduleProgress = useMemo(() => computeModuleProgress(modules, completedLessons), [modules, completedLessons])
  const maxWeeklyHours = Math.max(1, ...weeklyHours.map((w) => w.hours))

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const hoveredMinutes = hoveredDay
    ? heatmap.flat().find((d) => d?.date === hoveredDay)?.minutes ?? 0
    : null

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Estatísticas</span></h1>
        <p className="mt-1 text-text-secondary">Seu progresso de estudo ao longo do tempo</p>
      </div>

      <motion.div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem} className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{streak}d</p>
            <p className="text-xs text-text-muted">sequência atual</p>
          </div>
        </motion.div>
        <motion.div variants={staggerItem} className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-purple-500/10">
            <Clock className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalHours}h</p>
            <p className="text-xs text-text-muted">total registrado</p>
          </div>
        </motion.div>
        <motion.div variants={staggerItem} className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-cyan-500/10">
            <BookOpen className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{completedLessons.length}</p>
            <p className="text-xs text-text-muted">aulas concluídas</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Heatmap */}
      <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card mb-6 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
          <BarChart3 className="h-5 w-5" /> Dias estudados (últimas {HEATMAP_WEEKS} semanas)
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <div className="flex flex-col gap-1 pt-0.5 text-[9px] text-text-muted">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="flex h-3 w-3 items-center justify-center">{i % 2 === 1 ? label : ''}</span>
            ))}
          </div>
          <div className="flex gap-1">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={() => day && setHoveredDay(day.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn('h-3 w-3 rounded-sm', day ? heatColor(day.minutes) : 'bg-transparent')}
                    title={day ? `${day.date}: ${day.minutes}min` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 h-4 text-xs text-text-muted">
          {hoveredDay ? `${new Date(hoveredDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}: ${hoveredMinutes}min` : ' '}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly hours bar chart */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Horas por semana</h3>
          <div className="flex h-40 items-end gap-2">
            {weeklyHours.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-text-muted">{w.hours > 0 ? `${w.hours}h` : ''}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (w.hours / maxWeeklyHours) * 100)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className="w-full rounded-t-sm bg-accent/70"
                  style={{ minHeight: 4 }}
                />
                <span className="text-[9px] text-text-muted">{w.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Module progress */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Progresso por módulo</h3>
          {moduleProgress.length === 0 ? (
            <p className="text-sm text-text-muted">
              {activeCourseId ? 'Nenhum módulo carregado ainda — abra a página de Estudos.' : 'Sem curso selecionado.'}
            </p>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {moduleProgress.map((m) => {
                const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
                return (
                  <div key={m.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate text-text-secondary">{m.name}</span>
                      <span className="text-text-muted">{m.completed}/{m.total}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
