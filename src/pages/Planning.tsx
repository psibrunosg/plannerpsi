import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sunrise, ListChecks, CalendarDays, Smile, Meh, Frown, Heart,
  Plus, X, Save, TrendingUp, CheckCircle, Clock, Target,
  ChevronDown, ChevronUp, ClipboardList
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

import { getLocalTodayStr } from '@/lib/dateUtils'
function MorningRitual() {
  const tasks = useTaskStore((s) => s.tasks)
  const notes = usePlanningStore((s) => s.notes)
  const ensureTodayNote = usePlanningStore((s) => s.ensureTodayNote)
  const loading = usePlanningStore((s) => s.loading)
  const updateNote = usePlanningStore((s) => s.updateNote)
  const addToast = useToastStore((s) => s.addToast)

  const todayStr = getLocalTodayStr()
  const note = notes.find((n) => n.note_date === todayStr)

  useEffect(() => {
    if (!note && !loading) {
      ensureTodayNote()
    }
  }, [note, loading, ensureTodayNote])

  const [yesterdayReview, setYesterdayReview] = useState('')
  const [priorityInput, setPriorityInput] = useState('')
  const [priorities, setPriorities] = useState<string[]>([])
  const [mood, setMood] = useState<Mood | null>(null)
  const initialized = useRef<string | null>(null)

  // Sync state when note is loaded (only once per note)
  useEffect(() => {
    if (note && note.id !== initialized.current) {
      setYesterdayReview(note.yesterday_review ?? '')
      setPriorities(note.today_priorities ?? [])
      setMood(note.mood ?? null)
      initialized.current = note.id
    }
  }, [note])

  const todayTasks = tasks.filter((t) => t.due_date?.startsWith(todayStr) && t.status !== 'done' && t.status !== 'archived')

  // Auto-save debounced
  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      // Check if anything changed
      const prevRev = note.yesterday_review ?? ''
      const prevMood = note.mood ?? null
      const prevPriorities = note.today_priorities ?? []
      
      if (
        prevRev !== yesterdayReview ||
        JSON.stringify(prevPriorities) !== JSON.stringify(priorities) ||
        prevMood !== mood
      ) {
        updateNote(note.id, {
          yesterday_review: yesterdayReview.trim() || null,
          today_priorities: priorities,
          mood,
        })
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [yesterdayReview, priorities, mood, note, updateNote])

  if (!note) return <div className="glass-card p-6 min-h-[300px] animate-pulse" />

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

function MoodRetrospective() {
  const notes = usePlanningStore((s) => s.notes)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week')

  const now = new Date()
  const daysMap = { week: 7, month: 30, quarter: 90 }
  
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - daysMap[period])
  const startDateStr = getLocalTodayStr(startDate)

  const relevantNotes = notes.filter(n => n.note_date >= startDateStr && n.mood)
  const total = relevantNotes.length

  const moodCounts = relevantNotes.reduce((acc, note) => {
    if (note.mood) {
      acc[note.mood] = (acc[note.mood] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <motion.div variants={staggerItem} className="glass-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-pink-500/10">
            <Heart className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Retrospectiva de Humor</h3>
            <p className="text-xs text-text-muted">Como você tem se sentido</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-[var(--radius-sm)] bg-surface-hover p-1">
          {[
            { id: 'week', label: '7d' },
            { id: 'month', label: '30d' },
            { id: 'quarter', label: '90d' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as 'week' | 'month' | 'quarter')}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                period === tab.id ? 'bg-surface shadow-sm text-accent' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {total > 0 ? (
        <div className="space-y-3 mt-2">
          {MOOD_OPTIONS.map((opt) => {
            const count = moodCounts[opt.value] || 0
            const percentage = Math.round((count / total) * 100)
            return (
              <div key={opt.value} className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover", opt.color)}>
                  <opt.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-text-primary">{opt.label}</span>
                    <span className="text-text-muted">{count} dia{count !== 1 ? 's' : ''} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${percentage}%` }} 
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={cn("h-full", opt.color.replace('text-', 'bg-'))} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center text-center text-text-muted">
          <Smile className="mb-2 h-6 w-6 opacity-20" />
          <p className="text-sm">Sem registros no período.</p>
          <p className="text-xs">Preencha seu ritual matinal!</p>
        </div>
      )}
    </motion.div>
  )
}

function DailyNotes() {
  const notes = usePlanningStore((s) => s.notes)
  const ensureTodayNote = usePlanningStore((s) => s.ensureTodayNote)
  const loading = usePlanningStore((s) => s.loading)
  const updateNote = usePlanningStore((s) => s.updateNote)
  const addToast = useToastStore((s) => s.addToast)
  
  const todayStr = getLocalTodayStr()
  const note = notes.find((n) => n.note_date === todayStr)

  useEffect(() => {
    if (!note && !loading) {
      ensureTodayNote()
    }
  }, [note, loading, ensureTodayNote])

  const [noteText, setNoteText] = useState('')
  const initialized = useRef<string | null>(null)

  useEffect(() => {
    if (note && note.id !== initialized.current) {
      setNoteText(note.notes ?? '')
      initialized.current = note.id
    }
  }, [note])

  // Auto-save debounced
  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      const prevNotes = note.notes ?? ''
      if (prevNotes !== noteText) {
        updateNote(note.id, { notes: noteText.trim() || null })
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [noteText, note, updateNote])

  if (!note) return <div className="glass-card col-span-full p-6 min-h-[200px] animate-pulse" />

  const handleSave = () => {
    updateNote(note.id, { notes: noteText.trim() || null })
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
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
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

function NotesHistory() {
  const notes = usePlanningStore((s) => s.notes)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const todayStr = getLocalTodayStr()
  // Filter out today's note and only show notes that have some content
  const pastNotes = notes.filter(n => n.note_date !== todayStr && (n.notes || n.yesterday_review || n.today_priorities?.length))
  
  if (pastNotes.length === 0) return null

  return (
    <motion.div variants={staggerItem} className="glass-card col-span-full p-6 mt-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-surface-hover">
          <ClipboardList className="h-5 w-5 text-text-muted" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Histórico de Planejamento</h3>
          <p className="text-xs text-text-muted">Anotações e rituais de dias anteriores</p>
        </div>
      </div>

      <div className="space-y-3">
        {pastNotes.slice(0, 10).map((n) => {
          const isExpanded = expandedId === n.id
          const dateObj = new Date(n.note_date + 'T12:00:00Z') // prevent timezone shift
          const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
          
          return (
            <div key={n.id} className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-hover/30 overflow-hidden">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : n.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-surface-hover/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-text-primary capitalize">{dateStr}</span>
                  {n.mood && (() => {
                    const moodOpt = MOOD_OPTIONS.find(m => m.value === n.mood)
                    if (!moodOpt) return null
                    const Icon = moodOpt.icon
                    return (
                      <span className="flex items-center text-xs text-text-muted">
                        <Icon className="h-3.5 w-3.5 mr-1" />
                      </span>
                    )
                  })()}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border-subtle"
                  >
                    <div className="p-4 space-y-4">
                      {n.yesterday_review && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase mb-1">Como foi o dia anterior</p>
                          <p className="text-sm text-text-secondary">{n.yesterday_review}</p>
                        </div>
                      )}
                      
                      {n.today_priorities && n.today_priorities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase mb-1">Prioridades</p>
                          <ul className="list-inside list-disc text-sm text-text-secondary">
                            {n.today_priorities.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {n.notes && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase mb-1">Notas do Dia</p>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">{n.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function Planning() {
  const fetchNotes = usePlanningStore((s) => s.fetchNotes)

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Planejamento</span></h1>
        <p className="mt-1 text-text-secondary">Organize seu dia e semana</p>
      </div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" animate="visible">
        <MorningRitual />
        <WeeklyReview />
        <MoodRetrospective />
        <DailyNotes />
      </motion.div>
      <NotesHistory />
    </motion.div>
  )
}
