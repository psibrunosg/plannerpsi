import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, GripVertical, Play, X, AlignLeft,
  BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem, modalOverlay, modalContent } from '@/lib/motion'
import { useProcedureStore } from '@/stores/procedureStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { Procedure } from '@/types'

function ProcedureForm({ onClose }: { onClose: () => void }) {
  const addProcedure = useProcedureStore((s) => s.addProcedure)
  const addToast = useToastStore((s) => s.addToast)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([{ title: '', description: '' }])

  const handleAddStep = () => setSteps([...steps, { title: '', description: '' }])

  const handleRemoveStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))

  const handleStepChange = (i: number, field: 'title' | 'description', value: string) => {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || steps.every((s) => !s.title.trim())) return

    const validSteps = steps.filter((s) => s.title.trim())
    const procedure: Procedure = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || null,
      steps: validSteps.map((s, i) => ({
        id: crypto.randomUUID(),
        title: s.title.trim(),
        description: s.description.trim() || null,
        order: i,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addProcedure(procedure)
    addToast('Procedimento criado!', 'success')
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
        className="glass relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[var(--radius-lg)] shadow-2xl"
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 sticky top-0 glass z-10">
          <h2 className="text-lg font-semibold text-text-primary">Novo Procedimento</h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-text-muted hover:text-text-secondary">
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <input autoFocus type="text" placeholder="Nome do procedimento..." value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-lg font-medium text-text-primary placeholder:text-text-muted outline-none" />

          <div className="flex items-start gap-2">
            <AlignLeft className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
            <textarea placeholder="Descrição (opcional)..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Passos</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border-subtle p-3">
                  <GripVertical className="mt-1 h-4 w-4 shrink-0 text-text-muted/40" />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <input type="text" placeholder={`Passo ${i + 1}...`} value={step.title}
                      onChange={(e) => handleStepChange(i, 'title', e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted outline-none" />
                    <input type="text" placeholder="Detalhes (opcional)" value={step.description}
                      onChange={(e) => handleStepChange(i, 'description', e.target.value)}
                      className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-muted outline-none" />
                  </div>
                  {steps.length > 1 && (
                    <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveStep(i)}
                      className="mt-0.5 text-text-muted hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleAddStep}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-border-subtle py-2 text-xs font-medium text-text-muted hover:border-accent/30 hover:text-accent">
              <Plus className="h-3.5 w-3.5" />
              Adicionar passo
            </motion.button>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover">Cancelar</motion.button>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={!name.trim() || steps.every((s) => !s.title.trim())}
              className={cn('rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-white',
                name.trim() && steps.some((s) => s.title.trim()) ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed')}>
              Criar Procedimento
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function ProcedureCard({ procedure }: { procedure: Procedure }) {
  const [expanded, setExpanded] = useState(false)
  const deleteProcedure = useProcedureStore((s) => s.deleteProcedure)
  const addTask = useTaskStore((s) => s.addTask)
  const addToast = useToastStore((s) => s.addToast)

  const handleExecute = () => {
    const todayStr = new Date().toISOString()
    const todayDate = new Date()
    todayDate.setHours(23, 59, 59, 999)

    for (const step of procedure.steps) {
      addTask({
        id: crypto.randomUUID(),
        title: `[${procedure.name}] ${step.title}`,
        description: step.description,
        status: 'todo',
        priority: 'p2',
        due_date: todayDate.toISOString(),
        estimated_minutes: null,
        actual_minutes: null,
        parent_id: null,
        tags: [procedure.name],
        is_recurring: false,
        recurrence_rule: null,
        completed_at: null,
        position: step.order,
        kanban_column: 'todo',
        completion_percentage: 0,
        created_at: todayStr,
        updated_at: todayStr,
        user_id: null,
      })
    }

    addToast(`${procedure.steps.length} tarefas criadas para hoje!`, 'success')
  }

  return (
    <motion.div variants={staggerItem} className="glass-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </motion.button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <BookOpen className="h-4.5 w-4.5 text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{procedure.name}</h3>
          <p className="text-xs text-text-muted">{procedure.steps.length} passo{procedure.steps.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleExecute}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25"
          >
            <Play className="h-3.5 w-3.5" />
            Executar Hoje
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteProcedure(procedure.id)}
            className="rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle px-4 py-3 space-y-1.5">
              {procedure.description && (
                <p className="mb-2 text-xs text-text-secondary">{procedure.description}</p>
              )}
              {procedure.steps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-hover/50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">{step.title}</p>
                    {step.description && <p className="text-[11px] text-text-muted">{step.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Procedures() {
  const procedures = useProcedureStore((s) => s.procedures)
  const [formOpen, setFormOpen] = useState(false)

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Procedimentos</span></h1>
          <p className="mt-1 text-text-secondary">
            Templates passo a passo · {procedures.length} procedimento{procedures.length !== 1 ? 's' : ''}
          </p>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <Plus className="h-4 w-4" />
          Novo Procedimento
        </motion.button>
      </div>

      {procedures.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">Nenhum procedimento</h3>
          <p className="mt-1 text-sm text-text-secondary">Crie templates passo a passo para automatizar sua rotina</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
            <Plus className="h-4 w-4" />
            Criar primeiro procedimento
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
          {procedures.map((proc) => (
            <ProcedureCard key={proc.id} procedure={proc} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {formOpen && <ProcedureForm onClose={() => setFormOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
