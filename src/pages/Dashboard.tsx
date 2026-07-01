import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, CheckCircle, Clock, TrendingUp, Calendar, Flame } from 'lucide-react'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useTaskStore } from '@/stores/taskStore'
import { useFocusStore } from '@/stores/focusStore'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'

export default function Dashboard() {
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const sessions = useFocusStore((s) => s.sessions)

  const todayStr = new Date().toISOString().split('T')[0]

  const todayTasks = tasks.filter((t) => t.due_date?.startsWith(todayStr))
  const completedToday = tasks.filter((t) => t.completed_at?.startsWith(todayStr))
  const totalTasks = tasks.filter((t) => t.status !== 'archived').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length

  const todayFocusMinutes = sessions
    .filter((s) => s.started_at.startsWith(todayStr))
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)

  const widgets = [
    { title: 'Tarefas Hoje', value: todayTasks.length, subtitle: `${completedToday.length} concluídas`, icon: Target, color: 'text-accent', bg: 'bg-accent/10', path: '/tasks' },
    { title: 'Concluídas', value: doneTasks, subtitle: `de ${totalTasks} total`, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', path: '/tasks' },
    { title: 'Em Progresso', value: inProgressTasks, subtitle: 'tarefas ativas', icon: Clock, color: 'text-warning', bg: 'bg-warning/10', path: '/tasks' },
    { title: 'Tempo Focado', value: `${todayFocusMinutes}m`, subtitle: 'hoje', icon: Flame, color: 'text-danger', bg: 'bg-danger/10', path: '/focus' },
    { title: 'Produtividade', value: totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}%` : '0%', subtitle: 'taxa de conclusão', icon: TrendingUp, color: 'text-info', bg: 'bg-info/10', path: '/tasks' },
    { title: 'Próximas', value: tasks.filter((t) => t.due_date && t.status !== 'done' && t.status !== 'archived').length, subtitle: 'com prazo', icon: Calendar, color: 'text-accent-hover', bg: 'bg-accent/10', path: '/tasks' },
  ]

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Dashboard</span></h1>
          <p className="mt-1 text-text-secondary">Visão geral do seu progresso</p>
        </div>
        <div className="w-full sm:w-64 shrink-0">
          <WeatherWidget />
        </div>
      </div>

      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" animate="visible">
        {widgets.map((w) => (
          <motion.div 
            key={w.title} 
            variants={staggerItem} 
            whileHover={{ scale: 1.02, y: -2 }} 
            onClick={() => navigate(w.path)}
            className="glass-card p-5 cursor-pointer hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{w.title}</p>
                <p className="mt-1 text-3xl font-bold text-text-primary">{w.value}</p>
                <p className="mt-1 text-xs text-text-muted">{w.subtitle}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] ${w.bg}`}>
                <w.icon className={`h-6 w-6 ${w.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {tasks.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <Target className="h-10 w-10 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">Comece adicionando tarefas</h3>
          <p className="mt-2 text-text-secondary">
            Use <kbd className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono">Ctrl+K</kbd> para criar sua primeira tarefa
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
