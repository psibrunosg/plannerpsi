import { motion } from 'framer-motion'
import { Search, Sun, Moon, Plus, Command, RefreshCw } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { RadioControls } from './RadioControls'
import { StudyControls } from './StudyControls'
import { SpotifyControls } from './SpotifyControls'

export function Header({ isSyncing = false }: { isSyncing?: boolean }) {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setTaskFormOpen = useUIStore((s) => s.setTaskFormOpen)

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          {getGreeting()}
          {isSyncing && (
            <RefreshCw className="h-4 w-4 text-accent animate-spin" />
          )}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-active hover:text-text-secondary"
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="ml-2 hidden rounded bg-surface px-1.5 py-0.5 text-xs font-mono text-text-muted md:inline">
            <Command className="mr-0.5 inline h-3 w-3" />K
          </kbd>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTaskFormOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Nova Tarefa</span>
        </motion.button>

        <div className="mx-1 h-6 w-px bg-border-subtle hidden md:block"></div>

        <StudyControls />
        <RadioControls />
        <SpotifyControls />

        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="rounded-[var(--radius-sm)] p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </motion.button>
      </div>
    </header>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
