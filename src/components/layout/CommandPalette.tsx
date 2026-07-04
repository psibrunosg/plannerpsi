import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  CalendarDays,
  Settings,
  Plus,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { modalOverlay, modalContent } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useScrollLock } from '@/lib/useScrollLock'

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  category: string
}

export function CommandPalette() {
  const navigate = useNavigate()
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setTaskFormOpen = useUIStore((s) => s.setTaskFormOpen)
  const tasks = useTaskStore((s) => s.tasks)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  useScrollLock(commandPaletteOpen)

  const commands: CommandItem[] = [
    { id: 'new-task', label: 'Nova Tarefa', icon: Plus, action: () => { setTaskFormOpen(true); setCommandPaletteOpen(false) }, category: 'Ações' },
    { id: 'nav-dashboard', label: 'Ir para Dashboard', icon: LayoutDashboard, action: () => { navigate('/'); setCommandPaletteOpen(false) }, category: 'Navegação' },
    { id: 'nav-tasks', label: 'Ir para Tarefas', icon: CheckSquare, action: () => { navigate('/tasks'); setCommandPaletteOpen(false) }, category: 'Navegação' },
    { id: 'nav-focus', label: 'Ir para Foco', icon: Timer, action: () => { navigate('/focus'); setCommandPaletteOpen(false) }, category: 'Navegação' },
    { id: 'nav-planning', label: 'Ir para Planejamento', icon: CalendarDays, action: () => { navigate('/planning'); setCommandPaletteOpen(false) }, category: 'Navegação' },
    { id: 'nav-settings', label: 'Ir para Configurações', icon: Settings, action: () => { navigate('/settings'); setCommandPaletteOpen(false) }, category: 'Navegação' },
    ...tasks.slice(0, 10).map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      icon: CheckSquare,
      action: () => { useUIStore.getState().setTaskDetailId(t.id); setCommandPaletteOpen(false) },
      category: 'Tarefas',
    })),
  ]

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCommandPaletteOpen(!commandPaletteOpen)
    }
    if (!commandPaletteOpen) return
    if (e.key === 'Escape') setCommandPaletteOpen(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
    }
  }, [commandPaletteOpen, setCommandPaletteOpen, filtered, selectedIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <motion.div
            className="glass relative w-full max-w-lg rounded-[var(--radius-lg)] shadow-2xl"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              <Search className="h-5 w-5 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar comandos, tarefas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <kbd className="rounded bg-surface px-1.5 py-0.5 text-xs font-mono text-text-muted">
                Esc
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  Nenhum resultado encontrado
                </p>
              )}
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                    i === selectedIndex
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-surface-hover'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-xs text-text-muted">{item.category}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
