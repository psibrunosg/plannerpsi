import { motion } from 'framer-motion'
import { Sun, Moon, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useFocusStore } from '@/stores/focusStore'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { useRadioStore } from '@/stores/radioStore'
import { Calendar, Link as LinkIcon, Copy, Radio, Star, Play, Pause } from 'lucide-react'
import { useEffect } from 'react'

export default function Settings() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const pomodoroSettings = useFocusStore((s) => s.pomodoroSettings)
  const updateSettings = useFocusStore((s) => s.updateSettings)
  const user = useAuthStore((s) => s.user)
  const addToast = useToastStore((s) => s.addToast)

  const {
    stations, initStations,
    favorites, toggleFavorite, currentStation, setCurrentStation, isPlaying, setIsPlaying
  } = useRadioStore()

  useEffect(() => {
    initStations()
  }, [initStations])

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const baseCalendarUrl = user ? `${supabaseUrl}/functions/v1/calendar-feed/${user.id}.ics` : ''
  const webcalUrl = baseCalendarUrl.replace('https://', 'webcal://').replace('http://', 'webcal://')
  const outlookWebUrl = baseCalendarUrl ? `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(baseCalendarUrl)}&name=Planner%20PSI` : ''

  const copyToClipboard = () => {
    if (!baseCalendarUrl) return
    navigator.clipboard.writeText(baseCalendarUrl)
    addToast('Link copiado para a área de transferência!', 'success')
  }

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

        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Calendar className="h-5 w-5" /> Integração de Calendário (iCal)
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Use este link exclusivo para sincronizar suas tarefas com <b>Apple Calendar</b>, <b>Google Calendar</b> ou <b>Outlook</b>.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-surface-hover p-3 border border-border-subtle">
              <div className="flex items-center gap-2 overflow-hidden mr-4">
                <LinkIcon className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-xs text-text-muted truncate font-mono">
                  {baseCalendarUrl || 'Carregando...'}
                </span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="flex items-center gap-2 rounded bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar URL (.ics)
              </motion.button>
            </div>

            <div className="flex gap-2 mt-2">
              <a 
                href={outlookWebUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded bg-[#0078D4]/10 px-4 py-2 text-sm font-medium text-[#0078D4] hover:bg-[#0078D4]/20 border border-[#0078D4]/20 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Adicionar ao Outlook Web
              </a>
              <a 
                href={webcalUrl}
                className="flex items-center gap-2 rounded bg-surface-hover px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-active border border-border-subtle transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Abrir App Padrão (Apple, etc)
              </a>
            </div>
            
            <div className="text-xs text-text-muted space-y-1">
              <p><b>Google Calendar:</b> Copie a URL (.ics) acima &gt; Configurações &gt; Adicionar calendário &gt; Do URL.</p>
              <p><b>Outlook Desktop:</b> Copie a URL (.ics) &gt; Adicionar Calendário &gt; Assinar da Web.</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Radio className="h-5 w-5" /> Rádios de Foco Curadas
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Adicione essas rádios de alta qualidade e confiabilidade aos seus favoritos clicando na estrelinha.
          </p>

          <div className="h-[300px] overflow-y-auto custom-scrollbar -mx-2 px-2 flex flex-col gap-2">
            {stations.map(station => {
              const isFavorite = favorites.some(f => f.id === station.id)
              const isCurrent = currentStation?.id === station.id

              return (
                <div
                  key={station.id}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-sm)] p-2 transition-colors border",
                    isCurrent ? "bg-accent/5 border-accent/20" : "bg-surface-hover border-transparent hover:border-border-subtle"
                  )}
                >
                  <button
                    onClick={() => {
                      if (isCurrent) {
                        setIsPlaying(!isPlaying)
                      } else {
                        setCurrentStation(station)
                      }
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-surface overflow-hidden shrink-0 border border-border-subtle hover:border-accent transition-colors"
                  >
                    {station.favicon ? (
                      <img src={station.favicon} alt="" className="h-full w-full object-cover bg-white opacity-40" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <Radio className="h-5 w-5 text-text-muted opacity-40" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center text-text-primary">
                      {isCurrent && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </div>
                  </button>
                  
                  <div className="flex-1 overflow-hidden">
                    <p className={cn(
                      "truncate text-sm font-medium",
                      isCurrent ? "text-accent" : "text-text-primary"
                    )}>
                      {station.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {station.tags.split(',').slice(0, 3).join(', ')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(station)}
                    className="p-2 text-text-muted hover:text-accent transition-colors"
                  >
                    <Star className={cn("h-5 w-5", isFavorite && "fill-accent text-accent")} />
                  </button>
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

