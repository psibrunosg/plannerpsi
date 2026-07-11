import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, Kanban, Calendar, GanttChart, Plus, Filter, Archive, Search, Tag, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { ViewMode, DateTagId, Task } from '@/types'
import { PRIORITY_CONFIG, STATUS_CONFIG, DATE_FILTER_TABS } from '@/types'
import { KanbanBoard } from '@/components/views/KanbanBoard'
import { CalendarView } from '@/components/views/CalendarView'
import { TimelineView } from '@/components/views/TimelineView'
import { useProposalStore } from '@/stores/proposalStore'
import { TaskProposalModal } from '@/components/tasks/TaskProposalModal'
import { Send, Check, X as XIcon, Clock, CircleCheck, CircleX } from 'lucide-react'
import { getLocalTodayStr } from '@/lib/dateUtils'

const VIEW_OPTIONS: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'list', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
  { id: 'calendar', icon: Calendar, label: 'Calendário' },
  { id: 'timeline', icon: GanttChart, label: 'Timeline' },
]

function filterByDateTag(tasks: Task[], tag: DateTagId): Task[] {
  if (tag === 'all') return tasks

  const now = new Date()
  const todayStr = getLocalTodayStr(now)

  // Get this Sunday
  const day = now.getDay()
  const daysToSunday = day === 0 ? 0 : 7 - day
  const thisSunday = new Date(now)
  thisSunday.setDate(now.getDate() + daysToSunday)
  const thisSundayStr = getLocalTodayStr(thisSunday)

  // Get next Monday + Sunday
  const nextMon = new Date(thisSunday)
  nextMon.setDate(thisSunday.getDate() + 1)
  const nextMonStr = getLocalTodayStr(nextMon)
  
  const nextSun = new Date(nextMon)
  nextSun.setDate(nextMon.getDate() + 6)
  const nextSunStr = getLocalTodayStr(nextSun)

  // Tomorrow
  const tmrw = new Date(now)
  tmrw.setDate(now.getDate() + 1)
  const tmrwStr = getLocalTodayStr(tmrw)

  switch (tag) {
    case 'overdue':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < todayStr && t.status !== 'done')
    case 'today':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === todayStr)
    case 'tomorrow':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === tmrwStr)
    case 'this_week':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) > todayStr && t.due_date.slice(0, 10) <= thisSundayStr)
    case 'next_week':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) >= nextMonStr && t.due_date.slice(0, 10) <= nextSunStr)
    case 'future':
      return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) > nextSunStr)
    default:
      return tasks
  }
}

function CompletionBar({ percentage }: { percentage: number }) {
  if (percentage === 0) return null
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            percentage === 100 ? 'bg-success' : percentage >= 50 ? 'bg-accent' : 'bg-warning',
          )}
        />
      </div>
      <span className={cn(
        'text-[10px] font-bold',
        percentage === 100 ? 'text-success' : percentage >= 50 ? 'text-accent' : 'text-warning',
      )}>
        {percentage}%
      </span>
    </div>
  )
}

function ListView({ tasks: filteredTasks }: { tasks: Task[] }) {
  if (filteredTasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <Filter className="mb-4 h-12 w-12 text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary">Nenhuma tarefa</h3>
        <p className="mt-1 text-sm text-text-secondary">Crie sua primeira tarefa para começar</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredTasks.map((task) => (
        <div key={task.id} onClick={() => useUIStore.getState().setTaskDetailId(task.id)}
          className="glass-card flex cursor-pointer items-center gap-4 p-4 hover:translate-x-0.5 hover:shadow-md transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); task.status === 'done' ? useTaskStore.getState().updateTask(task.id, { status: 'todo', completed_at: null, completion_percentage: 0 }) : useTaskStore.getState().completeTask(task.id) }}
            className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              task.status === 'done' ? 'border-success bg-success/20 text-success' : 'border-text-muted hover:border-accent')}>
            {task.status === 'done' && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6L5 9L10 3" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary')}>{task.title}</p>
            {task.description && <p className="mt-0.5 text-xs text-text-muted truncate">{task.description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CompletionBar percentage={task.completion_percentage ?? 0} />
            {task.tags?.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{tag}</span>
            ))}
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>
              {PRIORITY_CONFIG[task.priority].label}
            </span>
            <span className={cn('text-xs', STATUS_CONFIG[task.status].color)}>{STATUS_CONFIG[task.status].label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const VIEW_COMPONENTS: Record<ViewMode, React.FC<{ tasks: Task[] }>> = {
  list: ListView,
  kanban: KanbanBoard,
  calendar: CalendarView,
  timeline: TimelineView,
}

export default function Tasks() {
  const { viewMode, setViewMode, setTaskFormOpen } = useUIStore()
  const tasks = useTaskStore((s) => s.tasks)
  const filter = useTaskStore((s) => s.filter)
  
  const [showArchived, setShowArchived] = useState(false)
  
  // Persistent filter state
  const [activeDateTag, setActiveDateTag] = useState<DateTagId>(() => {
    return (localStorage.getItem('tasks-date-tag') as DateTagId) || 'all'
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tasks-tag-filter') || '[]') } catch { return [] }
  })
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('tasks-search') || '')

  // Persist filter state changes
  useEffect(() => { localStorage.setItem('tasks-date-tag', activeDateTag) }, [activeDateTag])
  useEffect(() => { localStorage.setItem('tasks-tag-filter', JSON.stringify(selectedTags)) }, [selectedTags])
  useEffect(() => { localStorage.setItem('tasks-search', searchQuery) }, [searchQuery])

  const proposals = useProposalStore(s => s.proposals)
  const sentProposals = useProposalStore(s => s.sentProposals)
  const fetchProposals = useProposalStore(s => s.fetchProposals)
  const acceptProposal = useProposalStore(s => s.acceptProposal)
  const rejectProposal = useProposalStore(s => s.rejectProposal)
  const processingProposalId = useProposalStore(s => s.processingProposalId)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const proposalStatus = {
    pending: { label: 'Aguardando resposta', className: 'bg-warning/10 text-warning', icon: Clock },
    accepted: { label: 'Aceita', className: 'bg-success/10 text-success', icon: CircleCheck },
    rejected: { label: 'Recusada', className: 'bg-danger/10 text-danger', icon: CircleX },
  } as const

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])
  
  const filteredTasks = useMemo(() => {
    if (showArchived) return useTaskStore.getState().archivedTasks()
    let result = useTaskStore.getState().filteredTasks()
    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      )
    }
    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter((t) => selectedTags.every((tag) => t.tags?.includes(tag)))
    }
    return result
  }, [tasks, filter, showArchived, searchQuery, selectedTags])

  const archiveCompletedTasks = useTaskStore(s => s.archiveCompletedTasks)
  const addToast = useToastStore(s => s.addToast)

  const dateFilteredTasks = useMemo(
    () => filterByDateTag(filteredTasks, activeDateTag),
    [filteredTasks, activeDateTag],
  )

  // Count tasks per date category
  const counts = useMemo(() => {
    const result: Record<DateTagId, number> = { all: filteredTasks.length, overdue: 0, today: 0, tomorrow: 0, this_week: 0, next_week: 0, future: 0 }
    for (const tag of DATE_FILTER_TABS) {
      if (tag.id !== 'all') result[tag.id] = filterByDateTag(filteredTasks, tag.id).length
    }
    return result
  }, [filteredTasks])

  const ActiveView = VIEW_COMPONENTS[viewMode]
  
  const hasCompletedTasks = tasks.some(t => t.status === 'done')
  
  // All available tags across all non-archived tasks
  const allAvailableTags = useMemo(() => useTaskStore.getState().getAllTags(), [tasks])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleArchive = async () => {
    if (confirm("Tem certeza que deseja arquivar TODAS as tarefas concluídas? Elas sumirão desta lista.")) {
      const archived = await archiveCompletedTasks()
      if (archived) addToast("Tarefas arquivadas com sucesso!", "success")
    }
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">{showArchived ? 'Tarefas Arquivadas' : 'Tarefas'}</span></h1>
          <p className="mt-1 text-text-secondary">
            {activeDateTag === 'all' || showArchived
              ? `${filteredTasks.length} tarefa${filteredTasks.length !== 1 ? 's' : ''}`
              : `${dateFilteredTasks.length} de ${filteredTasks.length} tarefas`
            }
            {selectedTags.length > 0 && <span className="ml-1 text-accent">· {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}</span>}
            {searchQuery.trim() && <span className="ml-1 text-accent">· buscando</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!showArchived && (
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
          )}

          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => setShowArchived(!showArchived)}
            className={cn("flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors",
              showArchived ? "bg-accent/10 border-accent/20 text-accent" : "bg-surface-elevated border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title={showArchived ? "Voltar às Tarefas Ativas" : "Ver Arquivadas"}
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">{showArchived ? 'Ocultar Arquivadas' : 'Mostrar Arquivadas'}</span>
          </motion.button>

          {!showArchived && hasCompletedTasks && (
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={handleArchive}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-subtle px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              title="Arquivar Tarefas Concluídas"
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar Concluídas</span>
            </motion.button>
          )}

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsProposalModalOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-subtle px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <Send className="h-4 w-4 text-accent" />
            Propor
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setTaskFormOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </motion.button>
        </div>
      </div>

      {/* Propostas recebidas aguardam uma decisao do responsavel. */}
      {!showArchived && proposals.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Recebidas ({proposals.length})</h2>
          {proposals.map(proposal => (
            <div key={proposal.id} className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-l-4 border-l-accent">
              <div>
                <p className="text-sm font-medium text-text-primary">{proposal.title}</p>
                {proposal.description && <p className="text-xs text-text-muted mt-1">{proposal.description}</p>}
                <p className="text-xs text-accent mt-2">Solicitante: {proposal.sender_email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => rejectProposal(proposal.id)}
                  disabled={processingProposalId === proposal.id}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors border border-danger/20"
                >
                  <XIcon className="h-3 w-3" /> Recusar
                </button>
                <button
                  onClick={() => acceptProposal(proposal.id)}
                  disabled={processingProposalId === proposal.id}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  <Check className="h-3 w-3" /> {processingProposalId === proposal.id ? 'Aceitando...' : 'Aceitar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showArchived && sentProposals.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Enviadas ({sentProposals.length})</h2>
          {sentProposals.map((proposal) => {
            const status = proposalStatus[proposal.status]
            const StatusIcon = status.icon
            return (
              <div key={proposal.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{proposal.title}</p>
                  {proposal.description && <p className="mt-1 truncate text-xs text-text-muted">{proposal.description}</p>}
                  <p className="mt-2 text-xs text-text-muted">Responsável: {proposal.receiver_email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', status.className)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!showArchived && (
        <>
          {/* Date filter tabs */}
          <div className="mb-3 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-surface-elevated/60 p-1.5">
            {DATE_FILTER_TABS.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveDateTag(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-medium transition-all',
                  activeDateTag === tab.id
                    ? cn('bg-surface-active', tab.color)
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/50',
                )}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none',
                    activeDateTag === tab.id ? 'bg-white/10' : 'bg-surface-hover',
                    tab.id === 'overdue' && counts[tab.id] > 0 && 'bg-red-500/20 text-red-400',
                  )}>
                    {counts[tab.id]}
                  </span>
                )}
                {activeDateTag === tab.id && (
                  <motion.div
                    layoutId="date-tab-indicator"
                    className="absolute inset-0 rounded-[var(--radius-sm)] border border-border/50"
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Search bar + Tag filters row */}
          <div className="mb-5 flex flex-col gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated/60 py-2 pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Tag filter chips */}
            {allAvailableTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Tag className="h-3 w-3" />
                </span>
                {allAvailableTags.map((tag) => (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
                      selectedTags.includes(tag)
                        ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                        : 'bg-surface-elevated/80 text-text-muted hover:text-text-secondary hover:bg-surface-hover border border-border-subtle/60',
                    )}
                  >
                    <span className="opacity-60">#</span>{tag}
                    {selectedTags.includes(tag) && <X className="h-2.5 w-2.5 ml-0.5" />}
                  </motion.button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-text-muted hover:text-accent transition-colors ml-1"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={`${viewMode}-${showArchived}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <ActiveView tasks={showArchived ? filteredTasks : dateFilteredTasks} />
        </motion.div>
      </AnimatePresence>
      <TaskProposalModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} />
    </motion.div>
  )
}
