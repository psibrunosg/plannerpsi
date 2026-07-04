import { motion } from 'framer-motion'
import { Sun, Moon, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { useFocusStore } from '@/stores/focusStore'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { useRadioStore } from '@/stores/radioStore'
import { supabaseUrl } from '@/lib/supabase'
import { Calendar, Link as LinkIcon, Copy, Radio, Star, Play, Pause, Download, BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '@/lib/pushManager'

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
  const weatherCity = useUIStore((s) => s.weatherCity)
  const calendarIcsUrl = useUIStore((s) => s.calendarIcsUrl)
  const notificationsEnabled = useUIStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useUIStore((s) => s.setNotificationsEnabled)

  const [pushStatus, setPushStatus] = useState<'unsupported' | 'subscribed' | 'unsubscribed' | 'loading'>('loading')

  useEffect(() => {
    initStations()
  }, [initStations])

  useEffect(() => {
    getPushStatus().then(setPushStatus)
  }, [])

  const handleTogglePush = async () => {
    if (!user) return
    try {
      if (pushStatus === 'subscribed') {
        await unsubscribeFromPush()
        setPushStatus('unsubscribed')
        addToast('Alertas de app fechado desativados', 'info')
      } else {
        setPushStatus('loading')
        await subscribeToPush(user.id)
        setPushStatus('subscribed')
        addToast('Alertas de app fechado ativados!', 'success')
      }
    } catch (err: any) {
      addToast(err.message || 'Não foi possível ativar os alertas', 'error')
      setPushStatus(await getPushStatus())
    }
  }

  const baseCalendarUrl = user ? `${supabaseUrl}/functions/v1/calendar-feed/${user.id}.ics` : ''
  const webcalUrl = baseCalendarUrl.replace('https://', 'webcal://')
  const calendarName = encodeURIComponent('Planner PSI')
  const outlookPersonalUrl = baseCalendarUrl ? `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcalUrl)}&name=${calendarName}` : ''
  const outlookWorkUrl = baseCalendarUrl ? `https://outlook.office.com/calendar/addfromweb?url=${encodeURIComponent(webcalUrl)}&name=${calendarName}` : ''
  const googleCalendarUrl = baseCalendarUrl ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}` : ''

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
            <Timer className="h-5 w-5" /> Notificações
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Alertas de Atraso e Lembretes</p>
              <p className="text-xs text-text-muted">Receba notificações do Windows quando uma tarefa atrasar ou atingir o horário do lembrete</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn('relative h-8 w-14 rounded-full transition-colors', notificationsEnabled ? 'bg-accent' : 'bg-border')}>
              <motion.div className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
                animate={{ left: notificationsEnabled ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </motion.button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-text-muted shrink-0" />
              <div>
                <p className="text-sm text-text-primary">Alertas com o app fechado (Push)</p>
                <p className="text-xs text-text-muted">Recebe aviso de tarefas atrasadas todo hora, mesmo com o app fechado. Por dispositivo.</p>
              </div>
            </div>
            {pushStatus === 'unsupported' ? (
              <span className="text-xs text-text-muted shrink-0">Não suportado</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleTogglePush}
                disabled={pushStatus === 'loading'}
                className={cn(
                  'shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                  pushStatus === 'subscribed' ? 'bg-success/10 text-success' : 'bg-accent/15 text-accent hover:bg-accent/25'
                )}
              >
                {pushStatus === 'loading' ? '...' : pushStatus === 'subscribed' ? 'Ativado' : 'Ativar'}
              </motion.button>
            )}
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
            <Sun className="h-5 w-5" /> Localização do Clima
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Digite sua cidade para exibir a previsão do tempo no Dashboard sem precisar de GPS.
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={weatherCity || ''}
              onChange={(e) => useUIStore.getState().setWeatherCity(e.target.value)}
              placeholder="Ex: Porto Alegre" 
              className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-4 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" 
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Calendar className="h-5 w-5" /> Importar Calendário ICS (Outlook, etc)
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Cole a URL pública do seu calendário (.ics) para visualizar seus eventos dentro do Planner.
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={calendarIcsUrl || ''}
              onChange={(e) => useUIStore.getState().setCalendarIcsUrl(e.target.value)}
              placeholder="https://outlook.office365.com/.../calendar.ics" 
              className="w-full rounded-[var(--radius-sm)] bg-surface-hover px-4 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent font-mono" 
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Calendar className="h-5 w-5" /> Exportar Tarefas (iCal)
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

            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href={outlookPersonalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded bg-[#0078D4]/10 px-4 py-2 text-sm font-medium text-[#0078D4] hover:bg-[#0078D4]/20 border border-[#0078D4]/20 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Outlook (pessoal)
              </a>
              <a
                href={outlookWorkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded bg-[#0078D4]/10 px-4 py-2 text-sm font-medium text-[#0078D4] hover:bg-[#0078D4]/20 border border-[#0078D4]/20 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Outlook (corporativo)
              </a>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded bg-[#34A853]/10 px-4 py-2 text-sm font-medium text-[#34A853] hover:bg-[#34A853]/20 border border-[#34A853]/20 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Google Calendar
              </a>
              <a
                href={webcalUrl}
                className="flex items-center gap-2 rounded bg-surface-hover px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-active border border-border-subtle transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Apple / App Padrão
              </a>
              <a
                href={baseCalendarUrl}
                className="flex items-center gap-2 rounded bg-surface-hover px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-active border border-border-subtle transition-colors"
              >
                <Download className="h-4 w-4" />
                Baixar .ics
              </a>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <p>Os botões acima assinam o calendário (atualiza sozinho). O download .ics é uma importação única.</p>
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

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Buscar outras rádios no mundo todo..."
              className="flex-1 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  useRadioStore.getState().searchStations(e.currentTarget.value)
                }
              }}
            />
          </div>

          <div className="h-[300px] overflow-y-auto custom-scrollbar -mx-2 px-2 flex flex-col gap-2">
            {useRadioStore.getState().isLoading ? (
              <div className="p-4 text-center text-sm text-text-muted animate-pulse">Buscando rádios...</div>
            ) : stations.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-muted">Nenhuma rádio encontrada.</div>
            ) : (
              (() => {
                const groupedStations = stations.reduce((acc, station) => {
                  const code = station.countrycode?.toUpperCase() || 'OTHER'
                  if (!acc[code]) acc[code] = []
                  acc[code].push(station)
                  return acc
                }, {} as Record<string, typeof stations>)

                const countryLabels: Record<string, { label: string, emoji: string }> = {
                  'BR': { label: 'Brasil', emoji: '🇧🇷' },
                  'CO': { label: 'Colômbia', emoji: '🇨🇴' },
                  'PR': { label: 'Porto Rico', emoji: '🇵🇷' },
                  'UY': { label: 'Uruguai', emoji: '🇺🇾' },
                  'OTHER': { label: 'Foco & Lo-Fi', emoji: '🎧' },
                }

                const getCountryLabel = (code: string) => countryLabels[code] || { label: `Outros (${code})`, emoji: '🌍' }

                // Sort keys to put BR first, then CO, PR, UY, OTHER
                const sortedKeys = Object.keys(groupedStations).sort((a, b) => {
                  const order = ['BR', 'CO', 'PR', 'UY', 'OTHER']
                  const indexA = order.indexOf(a)
                  const indexB = order.indexOf(b)
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB
                  if (indexA !== -1) return -1
                  if (indexB !== -1) return 1
                  return a.localeCompare(b)
                })

                return sortedKeys.map(code => (
                  <div key={code} className="mb-2">
                    <h4 className="mb-2 mt-1 px-1 text-xs font-semibold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
                      <span>{getCountryLabel(code).emoji}</span> {getCountryLabel(code).label}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {groupedStations[code].map(station => {
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
                  </div>
                ))
              })()
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

