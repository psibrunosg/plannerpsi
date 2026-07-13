import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Calendar, Tag, Flag, Clock, AlignLeft, Percent, Repeat, ListTree, Plus, Trash2, CheckCircle2, Circle, User as UserIcon, Users, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { modalOverlay, modalContent } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { usePatientStore } from '@/stores/patientStore'
import { useFocusStore } from '@/stores/focusStore'
import type { TaskPriority, TaskStatus, RecurrenceFreq } from '@/types'
import { PRIORITY_CONFIG, SMART_DATE_TAGS, RECURRENCE_FREQ_CONFIG } from '@/types'
import { useScrollLock } from '@/lib/useScrollLock'
import { TaskComments } from './TaskComments'

export function TaskForm() {
  const navigate = useNavigate()
  const taskFormOpen = useUIStore((s) => s.taskFormOpen)
  const setTaskFormOpen = useUIStore((s) => s.setTaskFormOpen)
  const taskDetailId = useUIStore((s) => s.taskDetailId)
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId)

  // Get actions without subscribing to state changes
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addToast = useToastStore((s) => s.addToast)
  const allTasks = useTaskStore((s) => s.tasks)
  const activeSession = useFocusStore((s) => s.activeSession)
  const pomodoroSettings = useFocusStore((s) => s.pomodoroSettings)
  const startSession = useFocusStore((s) => s.startSession)

  const isOpen = taskFormOpen || !!taskDetailId
  const isEditing = !!taskDetailId
  useScrollLock(isOpen)

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
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)

  const currentUser = useAuthStore(s => s.user)
  const currentProfile = useAuthStore(s => s.profile)
  const allProfiles = useProfileStore(s => s.profiles)
  const patients = usePatientStore(s => s.patients)
  const fetchPatients = usePatientStore(s => s.fetchPatients)

  useEffect(() => {
    if (isOpen && patients.length === 0) {
      fetchPatients()
    }
  }, [isOpen, patients.length, fetchPatients])

  const assignableProfiles = allProfiles.filter(p => (currentProfile?.level ?? 1) > 1 && p.level <= currentProfile!.level)

  const subtasks = taskDetailId ? allTasks.filter((t) => t.parent_id === taskDetailId) : []
  const detailedTask = taskDetailId ? allTasks.find((task) => task.id === taskDetailId) : null
  const canStartFocus = detailedTask ? !['done', 'archived'].includes(detailedTask.status) : false

  const handleFocusTask = () => {
    if (!taskDetailId) return
    if (!activeSession) {
      startSession(taskDetailId, 'pomodoro', pomodoroSettings.workMinutes)
    }
    closeForm()
    navigate('/focus')
  }

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
    setIsRecurring(false)
    setRecurrenceFreq('weekly')
    setRecurrenceInterval(1)
    setSubtaskInput('')
    setAssigneeId(null)
    setPatientId(null)
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
        setIsRecurring(task.is_recurring)
        setRecurrenceFreq(task.recurrence_rule?.freq ?? 'weekly')
        setRecurrenceInterval(task.recurrence_rule?.interval ?? 1)
        setAssigneeId(task.assignee_id || null)
        setPatientId(task.patient_id || null)
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
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? { freq: recurrenceFreq, interval: recurrenceInterval } : null,
      // A new task defaults to its creator; while editing, an empty choice truly
      // removes the assignment instead of silently assigning it back to the creator.
      assignee_id: isEditing ? assigneeId : assigneeId ?? currentUser?.id ?? null,
      patient_id: patientId || null,
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

  const handleAddSubtask = () => {
    const value = subtaskInput.trim()
    if (!value || !taskDetailId) return
    const parentTask = allTasks.find((task) => task.id === taskDetailId)
    addTask({
      id: crypto.randomUUID(),
      title: value,
      description: null,
      status: 'todo',
      priority: 'p3',
      due_date: null,
      due_time: null,
      reminder_minutes: null,
      estimated_minutes: null,
      actual_minutes: null,
      parent_id: taskDetailId,
      tags: [],
      is_recurring: false,
      recurrence_rule: null,
      completed_at: null,
      position: 0,
      kanban_column: 'todo',
      completion_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
      assignee_id: parentTask?.assignee_id ?? assigneeId ?? currentUser?.id ?? null
    })
    setSubtaskInput('')
  }

  const handleToggleSubtask = (subtaskId: string, done: boolean) => {
    updateTask(subtaskId, {
      status: done ? 'todo' : 'done',
      completed_at: done ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
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
            className="glass relative w-full max-w-lg rounded-[var(--radius-lg)] shadow-2xl flex flex-col max-h-[90vh]"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeForm}
                className="text-text-muted hover:text-text-secondary">
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="space-y-4 p-6 overflow-y-auto">
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

                {assignableProfiles && assignableProfiles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 shrink-0 text-text-muted" />
                    <select value={assigneeId || ''} onChange={(e) => setAssigneeId(e.target.value || null)}
                      className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent">
                      <option value="">Atribuir a (Eu)</option>
                      {assignableProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                      ))}
                    </select>
                  </div>
                )}

                {patients && patients.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-text-muted" />
                    <select value={patientId || ''} onChange={(e) => setPatientId(e.target.value || null)}
                      className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent">
                      <option value="">Sem paciente vinculado</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

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

              {/* Recurrence */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-text-muted">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-accent"
                  />
                  <Repeat className="h-3.5 w-3.5" />
                  Repetir tarefa
                </label>
                {isRecurring && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-text-muted">A cada</span>
                    <input
                      type="number"
                      min={1}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 rounded-[var(--radius-sm)] bg-surface-hover px-2 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
                    />
                    <select
                      value={recurrenceFreq}
                      onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFreq)}
                      className="flex-1 rounded-[var(--radius-sm)] bg-surface-hover px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
                    >
                      {(Object.entries(RECURRENCE_FREQ_CONFIG) as [RecurrenceFreq, typeof RECURRENCE_FREQ_CONFIG.daily][]).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
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

              {/* Subtasks (only available once the parent task exists) */}
              {isEditing && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
                    <ListTree className="h-3.5 w-3.5" />
                    Subtarefas {subtasks.length > 0 && `(${subtasks.filter((s) => s.status === 'done').length}/${subtasks.length})`}
                  </label>
                  <div className="space-y-1">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface-hover px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(subtask.id, subtask.status === 'done')}
                          className={cn('shrink-0', subtask.status === 'done' ? 'text-success' : 'text-text-muted hover:text-accent')}
                        >
                          {subtask.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </button>
                        <span className={cn('flex-1 truncate text-sm', subtask.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary')}>
                          {subtask.title}
                        </span>
                        <button type="button" onClick={() => deleteTask(subtask.id)} className="shrink-0 text-text-muted hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar subtarefa..."
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() } }}
                      className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button type="button" onClick={handleAddSubtask} className="shrink-0 rounded-[var(--radius-sm)] bg-surface-hover px-2.5 text-text-muted hover:text-accent">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {isEditing && taskDetailId && (
                <TaskComments taskId={taskDetailId} />
              )}
              </div>

              <div className="flex justify-between gap-2 border-t border-border-subtle p-6 shrink-0 mt-auto">
                <div className="flex items-center gap-2">
                  {isEditing && (activeSession || canStartFocus) && (
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete}
                      className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Excluir</motion.button>
                  )}
                  {isEditing && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFocusTask}
                      className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                      title={activeSession ? 'Ir para a sessão de foco em andamento' : 'Iniciar um Pomodoro vinculado a esta tarefa'}
                    >
                      <Timer className="h-4 w-4" />
                      {activeSession ? 'Ir para foco' : 'Focar nesta tarefa'}
                    </motion.button>
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
