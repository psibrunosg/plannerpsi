import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Tag, Flag, Clock, AlignLeft, Percent } from 'lucide-react'
import { cn } from '@/lib/cn'
import { modalOverlay, modalContent } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { TaskPriority, TaskStatus } from '@/types'
import { PRIORITY_CONFIG, SMART_DATE_TAGS } from '@/types'

export function TaskForm() {
  const taskFormOpen = useUIStore((s) => s.taskFormOpen)
  const setTaskFormOpen = useUIStore((s) => s.setTaskFormOpen)
  const taskDetailId = useUIStore((s) => s.taskDetailId)
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)
  
  // Get actions without subscribing to state changes
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addToast = useToastStore((s) => s.addToast)

  const isOpen = taskFormOpen || !!taskDetailId
  const isEditing = !!taskDetailId

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('p3')
  const [_status] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [selectedDateTag, setSelectedDateTag] = useState<string | null>(null)

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('p3')
    setDueDate('')
    setDueTime('')
    setReminderMinutes('')
    setEstimatedMinutes('')
    setTagInput('')
    setTags([])
    setTagSuggestions([])
    setShowSuggestions(false)
    setCompletionPercentage(0)
    setSelectedDateTag(null)
  }

  const closeForm = () => {
    setTaskFormOpen(false)
    setTaskDetailId(null)
    setTimeout(reset, 200) // Reset after animation
  }

  useEffect(() => {
    if (taskDetailId) {
      // Read imperatively to avoid re-rendering TaskForm on every global task change
      const task = useTaskStore.getState().tasks.find(t => t.id === taskDetailId)
      if (task) {
        setTitle(task.title)
        setDescription(task.description || '')
        setPriority(task.priority)
        setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
        setDueTime(task.due_time || '')
        setReminderMinutes(task.reminder_minutes ?? '')
        setEstimatedMinutes(task.estimated_minutes?.toString() || '')
        setTags(task.tags || [])
        setCompletionPercentage(task.completion_percentage || 0)
        setSelectedDateTag(null)
      }
    } else if (taskFormOpen) {
      reset()
    }
  }, [taskDetailId, taskFormOpen])

  const handleSelectDateTag = (tagId: string) => {
    const tag = SMART_DATE_TAGS.find((t) => t.id === tagId)
    if (!tag) return

    if (selectedDateTag === tagId) {
      setSelectedDateTag(null)
      setDueDate('')
      return
    }

    setSelectedDateTag(tagId)
    setDueDate(tag.getDate())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
      due_time: dueTime || null,
      reminder_minutes: reminderMinutes === '' ? null : Number(reminderMinutes),
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      tags,
      completion_percentage: completionPercentage,
    }

    // Defer the heavy store update to allow the modal exit animation to be fluid
    const editingId = taskDetailId
    
    closeForm()
    
    setTimeout(() => {
      if (isEditing && editingId) {
        updateTask(editingId, {
          ...taskData,
          updated_at: new Date().toISOString(),
        })
        addToast('Tarefa atualizada!', 'success')
      } else {
        addTask({
          id: crypto.randomUUID(),
          ...taskData,
          status: _status,
          actual_minutes: null,
          parent_id: null,
          is_recurring: false,
          recurrence_rule: null,
          completed_at: null,
          position: 0,
          kanban_column: _status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: null,
        })
        addToast('Tarefa criada!', 'success')
      }
    }, 250) // 250ms covers the Framer Motion exit animation duration
  }

  const handleDelete = () => {
    if (isEditing && taskDetailId) {
      if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        const idToDelete = taskDetailId
        closeForm()
        setTimeout(() => {
          deleteTask(idToDelete)
          addToast('Tarefa excluída!', 'success')
        }, 250)
      }
    }
  }

  const handleAddTag = (value?: string) => {
    const t = (value ?? tagInput).trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
    setShowSuggestions(false)
    tagInputRef.current?.focus()
  }

  const handleTagInputChange = (val: string) => {
    setTagInput(val)
    if (val.trim().length > 0) {
      const allTags = useTaskStore.getState().getAllTags()
      const filtered = allTags.filter(
        (t) => t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t)
      )
      setTagSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      // Show all available tags when input is focused and empty
      const allTags = useTaskStore.getState().getAllTags().filter((t) => !tags.includes(t))
      setTagSuggestions(allTags)
      setShowSuggestions(allTags.length > 0)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />

          <motion.div
            className="glass relative w-full max-w-lg rounded-[var(--radius-lg)] shadow-2xl"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeForm}
                className="text-text-muted hover:text-text-secondary">
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <input autoFocus type="text" placeholder="Título da tarefa..." value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-text-primary placeholder:text-text-muted outline-none" />

              <div className="flex items-start gap-2">
                <AlignLeft className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
                <textarea placeholder="Descrição (opcional)..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" />
              </div>

              {/* Smart Date Tags */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Data rápida
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SMART_DATE_TAGS.map((tag) => (
                    <motion.button
                      key={tag.id}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectDateTag(tag.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-all',
                        selectedDateTag === tag.id
                          ? cn(tag.bg, tag.color, 'ring-1 ring-current')
                          : 'bg-surface-hover text-text-muted hover:text-text-secondary',
                      )}
                    >
                      {tag.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 shrink-0 text-text-muted" />
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent">
                    {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof PRIORITY_CONFIG.p1][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
                  <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setSelectedDateTag(null) }}
                    className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" />
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-text-muted" />
                  <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" />
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-text-muted" />
                  <select value={reminderMinutes === '' ? '' : reminderMinutes} onChange={(e) => setReminderMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent">
                    <option value="">Sem lembrete</option>
                    <option value="0">Na hora</option>
                    <option value="5">5 min antes</option>
                    <option value="15">15 min antes</option>
                    <option value="30">30 min antes</option>
                    <option value="60">1 hora antes</option>
                    <option value="1440">1 dia antes</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-text-muted" />
                  <input type="number" placeholder="Tempo est. (min)" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} min={1}
                    className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" />
                </div>

                <div className="flex items-center gap-2 relative">
                  <Tag className="h-4 w-4 shrink-0 text-text-muted" />
                  <div className="relative flex-1">
                    <input
                      ref={tagInputRef}
                      type="text"
                      placeholder="Tag + Enter"
                      value={tagInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onFocus={() => handleTagInputChange(tagInput)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
                        if (e.key === 'Escape') setShowSuggestions(false)
                      }}
                      className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
                    />
                    {showSuggestions && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-[var(--radius-sm)] border border-border-subtle bg-surface shadow-xl max-h-40 overflow-y-auto">
                        {tagSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleAddTag(suggestion) }}
                            className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-accent/10 hover:text-accent transition-colors"
                          >
                            <span className="mr-1.5 opacity-50">#</span>{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion % slider */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
                  <Percent className="h-3.5 w-3.5" />
                  Conclusão: {completionPercentage}%
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-surface-hover accent-accent cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md"
                  />
                  <span className="min-w-[3ch] text-right text-sm font-bold text-accent">{completionPercentage}%</span>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-accent-hover"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-2 border-t border-border-subtle pt-4">
                <div>
                  {isEditing && (
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete}
                      className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Excluir</motion.button>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeForm}
                    className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover">Cancelar</motion.button>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!title.trim()}
                    className={cn('rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-white',
                      title.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed')}>
                    {isEditing ? 'Salvar' : 'Criar Tarefa'}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
