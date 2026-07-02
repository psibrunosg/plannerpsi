
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, AlignLeft, KanbanSquare, ListPlus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem, modalOverlay, modalContent } from '@/lib/motion'
import { useProcedureStore } from '@/stores/procedureStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ProcedureBoard } from '@/components/procedures/ProcedureBoard'
import { ProcedureFlow } from '@/components/procedures/ProcedureFlow'
import { parseStepDesc } from '@/lib/procedureParser'
import type { Procedure } from '@/types'

function ProcedureForm({ onClose }: { onClose: () => void }) {
  const addProcedure = useProcedureStore((s) => s.addProcedure)
  const addToast = useToastStore((s) => s.addToast)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const procedure: Procedure = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || null,
      steps: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addProcedure(procedure)
    addToast('Plano criado!', 'success')
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="glass relative w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] shadow-2xl"
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">Novo Plano</h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-text-muted hover:text-text-secondary">
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <input autoFocus type="text" placeholder="Nome do plano..." value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-lg font-medium text-text-primary placeholder:text-text-muted outline-none border-b border-border-subtle pb-2 focus:border-accent transition-colors" />

          <div className="flex items-start gap-2 pt-2">
            <AlignLeft className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
            <textarea placeholder="Descrição (opcional)..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover">Cancelar</button>
            <button type="submit" disabled={!name.trim()}
              className={cn('rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-white transition-colors',
                name.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed')}>
              Criar Plano
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function BoardCard({ procedure, onClick }: { procedure: Procedure; onClick: () => void }) {
  const deleteProcedure = useProcedureStore((s) => s.deleteProcedure)
  const addTask = useTaskStore((s) => s.addTask)
  const addToast = useToastStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)

  const handleInstantiate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (procedure.steps.length === 0) {
      addToast('O plano não tem passos.', 'error')
      return
    }

    const today = new Date().toISOString()
    const parentId = crypto.randomUUID()
    
    // Create parent task
    const parentTask = {
      id: parentId,
      title: procedure.name,
      description: procedure.description || null,
      status: 'todo' as const,
      priority: 'p3' as const,
      due_date: today,
      due_time: null,
      reminder_minutes: null,
      tags: [],
      is_recurring: false,
      estimated_minutes: null,
      actual_minutes: null,
      parent_id: null,
      recurrence_rule: null,
      completed_at: null,
      position: 0,
      kanban_column: 'todo',
      completion_percentage: 0,
      created_at: today,
      updated_at: today,
      user_id: user?.id || ''
    }
    addTask(parentTask)

    // Create subtasks
    const sortedSteps = [...procedure.steps].sort((a, b) => a.order - b.order)
    sortedSteps.forEach((step, index) => {
      addTask({
        id: crypto.randomUUID(),
        title: step.title,
        description: step.description ? parseStepDesc(step.description).text || null : null,
        status: 'todo' as const,
        priority: 'p3' as const,
        due_date: today,
        due_time: null,
        reminder_minutes: null,
        parent_id: parentId,
        tags: [],
        position: index,
        is_recurring: false,
        estimated_minutes: null,
        actual_minutes: null,
        recurrence_rule: null,
        completed_at: null,
        kanban_column: 'todo',
        completion_percentage: 0,
        created_at: today,
        updated_at: today,
        user_id: user?.id || ''
      })
    })

    addToast(`Plano '${procedure.name}' adicionado às tarefas de hoje!`, 'success')
  }

  return (
    <motion.div variants={staggerItem} className="glass-card group relative cursor-pointer overflow-hidden transition-all hover:border-accent/30 hover:shadow-lg" onClick={onClick}>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <KanbanSquare className="h-5 w-5 text-accent" />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleInstantiate}
              className="rounded p-1.5 text-text-muted opacity-0 hover:bg-accent/10 hover:text-accent group-hover:opacity-100 transition-all"
              title="Adicionar às tarefas do dia"
            >
              <ListPlus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteProcedure(procedure.id); }}
              className="rounded p-1.5 text-text-muted opacity-0 hover:bg-danger/10 hover:text-danger group-hover:opacity-100 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <h3 className="mb-1 font-semibold text-text-primary line-clamp-1">{procedure.name}</h3>
        <p className="text-xs text-text-muted">{procedure.steps.length} tarefa{procedure.steps.length !== 1 ? 's' : ''}</p>
      </div>
    </motion.div>
  )
}

export default function Procedures() {
  const procedures = useProcedureStore((s) => s.procedures)
  const [formOpen, setFormOpen] = useState(false)
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'flow'>('kanban')

  const activeBoard = procedures.find(p => p.id === activeBoardId)

  if (activeBoard) {
    return (
      <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="h-full relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-surface border border-border-subtle rounded-lg p-1 shadow-md">
          <button 
            onClick={() => setViewMode('kanban')}
            className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === 'kanban' ? "bg-accent text-white" : "text-text-muted hover:text-text-primary")}
          >
            Kanban
          </button>
          <button 
            onClick={() => setViewMode('flow')}
            className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === 'flow' ? "bg-accent text-white" : "text-text-muted hover:text-text-primary")}
          >
            Fluxo (n8n)
          </button>
        </div>
        {viewMode === 'kanban' ? (
          <ProcedureBoard procedure={activeBoard} onBack={() => setActiveBoardId(null)} />
        ) : (
          <ProcedureFlow procedure={activeBoard} onBack={() => setActiveBoardId(null)} />
        )}
      </motion.div>
    )
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="h-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Meus Planos</span></h1>
          <p className="mt-1 text-text-secondary">
            Gerencie seus fluxos de trabalho em quadros Kanban
          </p>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover shadow-md">
          <Plus className="h-4 w-4" />
          Novo Plano
        </motion.button>
      </div>

      {procedures.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <KanbanSquare className="mb-4 h-16 w-16 text-text-muted opacity-20" />
          <h3 className="text-xl font-semibold text-text-primary">Nenhum plano criado</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-sm">Crie quadros para organizar Integração de Funcionários, Lançamentos e outros processos importantes.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
            <Plus className="h-4 w-4" />
            Criar primeiro plano
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" variants={staggerContainer} initial="hidden" animate="visible">
          {procedures.map((proc) => (
            <BoardCard key={proc.id} procedure={proc} onClick={() => setActiveBoardId(proc.id)} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {formOpen && <ProcedureForm onClose={() => setFormOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
