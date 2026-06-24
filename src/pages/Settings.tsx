import { motion } from 'framer-motion'
import { Sun, Moon, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useFocusStore } from '@/stores/focusStore'

export default function Settings() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const pomodoroSettings = useFocusStore((s) => s.pomodoroSettings)
  const updateSettings = useFocusStore((s) => s.updateSettings)

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Configurações</span></h1>
        <p className="mt-1 text-text-secondary">Personalize seu planner</p>
      </div>

      <motion.div className="max-w-2xl space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Aparência
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Tema</p>
              <p className="text-xs text-text-muted">Escolha entre claro e escuro</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme}
              className={cn('relative h-8 w-14 rounded-full transition-colors', theme === 'dark' ? 'bg-accent' : 'bg-border')}>
              <motion.div className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
                animate={{ left: theme === 'dark' ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Timer className="h-5 w-5" />Pomodoro
          </h3>
          <div className="space-y-4">
            {([
              { label: 'Trabalho (min)', key: 'workMinutes' as const, value: pomodoroSettings.workMinutes },
              { label: 'Pausa curta (min)', key: 'shortBreakMinutes' as const, value: pomodoroSettings.shortBreakMinutes },
              { label: 'Pausa longa (min)', key: 'longBreakMinutes' as const, value: pomodoroSettings.longBreakMinutes },
              { label: 'Sessões antes da pausa longa', key: 'sessionsBeforeLong' as const, value: pomodoroSettings.sessionsBeforeLong },
            ]).map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{setting.label}</span>
                <input type="number" min={1} max={120} value={setting.value}
                  onChange={(e) => updateSettings({ [setting.key]: parseInt(e.target.value) || 1 })}
                  className="w-20 rounded-[var(--radius-sm)] bg-surface-hover px-3 py-1.5 text-center text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
