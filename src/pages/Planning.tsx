import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sunrise, ListChecks, CalendarDays, Smile, Meh, Frown, Heart,
  Plus, X, Save, TrendingUp, CheckCircle, Clock, Target,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useTaskStore } from '@/stores/taskStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useFocusStore } from '@/stores/focusStore'
import { useToastStore } from '@/stores/toastStore'
import type { Mood } from '@/types'

const MOOD_OPTIONS: { value: Mood; icon: React.ElementType; label: string; color: string }[] = [
  { value: 'great', icon: Heart, label: 'Ótimo', color: 'text-pink-400' },
  { value: 'good', icon: Smile, label: 'Bom', color: 'text-green-400' },
  { value: 'okay', icon: Meh, label: 'Ok', color: 'text-yellow-400' },
  { value: 'bad', icon: Frown, label: 'Difícil', color: 'text-red-400' },
]

function MorningRitual() {
  const tasks = useTaskStore((s) => s.tasks)
  const note = usePlanningStore((s) => s.getOrCreateToday())
  const updateNote = usePlanningStore((s) => s.updateNote)
  const addToast = useToastStore((s) => s.addToast)

  const todayStr = new Date().toISOString().split('T')[0]

  const [yesterdayReview, setYesterdayReview] = useState(note.yesterday_review ?? '')
  const [priorityInput, setPriorityInput] = useState('')
  const [priorities, setPriorities] = useState<string[]>(note.today_priorities)
  const [mood, setMood] = useState<Mood | null>(note.mood)

  const todayTasks = tasks.filter((t) => t.due_date?.startsWith(todayStr) && t.status !== 'done' && t.status !== 'archived')

  const handleAddPriority = () => {
    const p = priorityInput.trim()
    if (p && !priorities.includes(p)) {
      const newPriorities = [...priorities, p]
      setPriorities(newPriorities)
      setPriorityInput('')
      updateNote(note.id, { today_priorities: newPriorities })
    }
  }

  const handleRemovePriority = (p: string) => {
    const newPriorities = priorities.filter((x) => x !== p)
    setPriorities(newPriorities)
    updateNote(note.id, { today_priorities: newPriorities })
  }

  const handleSave = () => {
    updateNote(note.id, {
      yesterday_review: yesterdayReview.trim() || null,
      today_priorities: priorities,
      mood,
    })
    addToast('Ritual salvo!', 'success')
  }

  return (
    <motion.div variants={staggerItem} className="glass-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10">
            <Sunrise className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Ritual Matinal</h3>
            <p className="text-xs text-text-muted">Planeje seu dia</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25">
          <Save className="h-3.5 w-3.5" />
          Salvar
        </motion.button>
      </div>

      {/* Mood */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Como você está?</label>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setMood(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[var(--radius-sm)] px-4 py-2.5 transition-all',
                mood === opt.value
                  ? cn('bg-surface-active ring-1 ring-current', opt.color)
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary',
              )}
            >
              <opt.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Yesterday review */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Como foi ontem?</label>
        <textarea
          value={yesterdayReview}
          onChange={(e) => setYesterdayReview(e.target.value)}
          placeholder="Reflexão rápida sobre o dia anterior..."
          rows={2}
          className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Today priorities */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Prioridades de Hoje</label>
        <div className="space-y-1.5">
          {priorities.map((p, i) => (
            <motion.div key={p} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-md bg-surface-hover/50 px-3 py-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent">{i + 1}</span>
              <span className="flex-1 text-sm text-text-primary">{p}</span>
              <button onClick={() => handleRemovePriority(p)} className="text-text-muted hover:text-danger">
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input type="text" placeholder="Adicionar prioridade..." value={priorityInput}
            onChange={(e) => setPriorityInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPriority() } }}
            className="flex-1 rounded-[var(--radius-sm)] bg-surface-hover px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddPriority}
            className="rounded-[var(--radius-sm)] bg-surface-hover p-1.5 text-text-muted hover:text-accent">
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Today's tasks quick view */}
      {todayTasks.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-sm)] bg-surface-hover/40 p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            📋 {todayTasks.length} tarefa{todayTasks.length !== 1 ? 's' : ''} para hoje
          </p>
          <div className="space-y-1">
            {todayTasks.slice(0, 5).map((t) => (
              <p key={t.id} className="text-xs text-text-secondary truncate">• {t.title}</p>
            ))}
            {todayTasks.length > 5 && (
              <p className="text-[10px] text-text-muted">+{todayTasks.length - 5} mais</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function WeeklyReview() {
  const tasks = useTaskStore((s) => s.tasks)
  const sessions = useFocusStore((s) => s.sessions)

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const completedThisWeek = tasks.filter((t) => t.completed_at && t.completed_at >= weekStart.toISOString())
  const focusMinutes = sessions
    .filter((s) => s.started_at >= weekStart.toISOString())
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)

  const totalActive = tasks.filter((t) => t.status !== 'archived' && t.status !== 'done').length
  const totalDone = tasks.filter((t) => t.status === 'done').length
  const productivityRate = totalActive + totalDone > 0 ? Math.round((totalDone / (totalActive + totalDone)) * 100) : 0

  const stats = [
    { label: 'Concluídas esta semana', value: completedThisWeek.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Tempo focado', value: `${focusMinutes}m`, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Taxa de produtividade', value: `${productivityRate}%`, icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Tarefas ativas', value: totalActive, icon: Target, color: 'text-accent', bg: 'bg-accent/10' },
  ]

  return (
    <motion.div variants={staggerItem} className="glass-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-info/10">
          <ListChecks className="h-5 w-5 text-info" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Revisão Semanal</h3>
          <p className="text-xs text-text-muted">Análise da semana atual</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-sm)] bg-surface-hover/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', stat.bg)}>
                <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-[10px] text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DailyNotes() {
  const note = usePlanningStore((s) => s.getOrCreateToday())
  const updateNote = usePlanningStore((s) => s.updateNote)
  const addToast = useToastStore((s) => s.addToast)
  const [notes, setNotes] = useState(note.notes ?? '')

  const handleSave = () => {
    updateNote(note.id, { notes: notes.trim() || null })
    addToast('Nota salva!', 'success')
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <motion.div variants={staggerItem} className="glass-card col-span-full p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <CalendarDays className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Notas do Dia</h3>
            <p className="text-xs text-text-muted capitalize">{dateStr}</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25">
          <Save className="h-3.5 w-3.5" />
          Salvar
        </motion.button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anotações livres do dia — ideias, aprendizados, reflexões..."
        rows={5}
        className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent leading-relaxed"
      />

      {/* Mood indicator */}
      {note.mood && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-text-muted">Humor do dia:</span>
          {(() => {
            const opt = MOOD_OPTIONS.find((o) => o.value === note.mood)
            return opt ? (
              <span className={cn('flex items-center gap-1 text-xs font-medium', opt.color)}>
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </span>
            ) : null
          })()}
        </div>
      )}
    </motion.div>
  )
}

export default function Planning() {
  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Planejamento</span></h1>
        <p className="mt-1 text-text-secondary">Organize seu dia e semana</p>
      </div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerContainer} initial="hidden" animate="visible">
        <MorningRitual />
        <WeeklyReview />
        <DailyNotes />
      </motion.div>
    </motion.div>
  )
}
