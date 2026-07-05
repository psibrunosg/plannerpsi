import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Flame, Clock, BookOpen } from 'lucide-react'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useFocusStore } from '@/stores/focusStore'
import { useStudyStore } from '@/stores/studyStore'
import { useTaskStore } from '@/stores/taskStore'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useProcedureStore } from '@/stores/procedureStore'
import { computeStudyStreak, buildHeatmap, computeModuleProgress } from '@/lib/studyStats'
import { cn } from '@/lib/cn'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const HEATMAP_WEEKS = 12
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
  const tasks = useTaskStore((s) => s.tasks)
  const procedures = useProcedureStore((s) => s.procedures)
  const { xp, level, getXPForCurrentLevel, getXPForNextLevel } = useGamificationStore()
  const { modules, activeCourseId, completedLessons, loadModules } = useStudyStore()
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const streak = useMemo(() => computeStudyStreak(sessions), [sessions])
  const heatmap = useMemo(() => buildHeatmap(sessions, HEATMAP_WEEKS), [sessions])
  const moduleProgress = useMemo(() => computeModuleProgress(modules, completedLessons), [modules, completedLessons])

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const hoveredMinutes = hoveredDay
    ? heatmap.flat().find((d) => d?.date === hoveredDay)?.minutes ?? 0
    : null

  // Focus Line Chart Data (Last 7 Days)
  const focusChartData = useMemo(() => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const daySessions = sessions.filter(s => s.started_at.startsWith(dateStr))
      const minutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
      data.push({
        name: format(date, 'EEEEEE', { locale: ptBR }),
        fullDate: format(date, "dd 'de' MMMM", { locale: ptBR }),
        minutes
      })
    }
    return data
  }, [sessions])

  // Tasks Pie Chart Data
  const tasksChartData = useMemo(() => {
    const todo = tasks.filter(t => t.status === 'todo').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const done = tasks.filter(t => t.status === 'done').length
    return [
      { name: 'A Fazer', value: todo, color: '#94a3b8' },
      { name: 'Em Progresso', value: inProgress, color: '#F4A261' },
      { name: 'Concluídas', value: done, color: '#A4C3B2' },
    ].filter(d => d.value > 0)
  }, [tasks])

  // Procedures Stats
  const totalProcedures = procedures.length
  const totalSteps = procedures.reduce((acc, p) => acc + p.steps.length, 0)

  // XP Progress
  const currentLevelXP = getXPForCurrentLevel(level)
  const nextLevelXP = getXPForNextLevel(level)
  const xpProgress = Math.max(0, Math.min(100, ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))

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
        {/* Foco e Produtividade (Line Chart) */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Foco e Produtividade (Últimos 7 dias)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                  itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                  labelFormatter={(_, payload) => payload.length > 0 ? payload[0].payload.fullDate : ''}
                  formatter={(value: any) => [`${value} minutos`, 'Foco']}
                />
                <Line type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status das Tarefas (Pie Chart) */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Status das Tarefas</h3>
          {tasksChartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-text-muted">Nenhuma tarefa criada.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tasksChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gamification Stats */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6 flex flex-col justify-center">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Sua Evolução (Nível {level})</h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-secondary">Progresso Atual</span>
            <span className="text-text-muted">{xp} / {nextLevelXP} XP</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-hover relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-accent rounded-full"
            />
          </div>
          <p className="mt-4 text-xs text-text-muted text-center">
            Complete tarefas e sessões de foco para ganhar XP e subir de nível!
          </p>
          
          <div className="mt-6 pt-6 border-t border-border-subtle flex justify-between items-center text-center">
            <div>
              <p className="text-xl font-bold text-text-primary">{totalProcedures}</p>
              <p className="text-xs text-text-muted">Protocolos</p>
            </div>
            <div className="w-px h-10 bg-border-subtle mx-4" />
            <div>
              <p className="text-xl font-bold text-accent">{totalSteps}</p>
              <p className="text-xs text-text-muted">Passos Mapeados</p>
            </div>
          </div>
        </motion.div>

        {/* Module progress */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Progresso dos Cursos</h3>
          {moduleProgress.length === 0 ? (
            <p className="text-sm text-text-muted">
              {activeCourseId ? 'Nenhum módulo carregado ainda — abra a página de Estudos.' : 'Sem curso selecionado.'}
            </p>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {moduleProgress.map((m) => {
                const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
                return (
                  <div key={m.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="truncate text-text-secondary font-medium">{m.name}</span>
                      <span className="text-text-muted text-xs">{m.completed}/{m.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
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
