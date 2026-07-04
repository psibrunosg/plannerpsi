import { useEffect, useState } from 'react'
import { Calendar, Clock, Loader2, CalendarX2, ListPlus, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { fetchICSEvents } from '@/lib/icsParser'
import type { ICSEvent } from '@/lib/icsParser'
import { getLocalTodayStr } from '@/lib/dateUtils'
import { staggerItem } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface AgendaWidgetProps {
  maxEvents?: number
  className?: string
  date?: Date
}

export function AgendaWidget({ maxEvents = 5, className, date = new Date() }: AgendaWidgetProps) {
  const [events, setEvents] = useState<ICSEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const icsUrl = useUIStore((s) => s.calendarIcsUrl)
  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const addToast = useToastStore((s) => s.addToast)

  const eventTaskExists = (event: ICSEvent) => {
    const eventDate = getLocalTodayStr(event.dtstart)
    return tasks.some((t) => t.title === event.summary && t.due_date?.split('T')[0] === eventDate)
  }

  const importEventAsTask = (event: ICSEvent) => {
    if (eventTaskExists(event)) {
      addToast('Tarefa já existe para este evento', 'info')
      return
    }

    const isAllDay = event.dtstart.getHours() === 0 && event.dtstart.getMinutes() === 0 &&
      event.dtend.getTime() - event.dtstart.getTime() >= 24 * 60 * 60 * 1000

    addTask({
      id: crypto.randomUUID(),
      title: event.summary,
      description: [event.location, event.description].filter(Boolean).join('\n') || null,
      status: 'todo',
      priority: 'p3',
      due_date: new Date(getLocalTodayStr(event.dtstart) + 'T12:00:00').toISOString(),
      due_time: isAllDay ? null : event.dtstart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      reminder_minutes: null,
      estimated_minutes: null,
      actual_minutes: null,
      parent_id: null,
      tags: ['agenda'],
      is_recurring: false,
      recurrence_rule: null,
      completed_at: null,
      position: 0,
      kanban_column: 'todo',
      completion_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: useAuthStore.getState().user?.id ?? null,
    })
    addToast('Tarefa criada a partir da agenda!', 'success')
  }

  useEffect(() => {
    if (!icsUrl) return

    let isMounted = true
    
    const loadEvents = async () => {
      setLoading(true)
      setError(false)
      
      try {
        const data = await fetchICSEvents(icsUrl)
        if (isMounted) {
          // Filter events for the specified date
          const targetStart = new Date(date)
          targetStart.setHours(0, 0, 0, 0)
          
          const targetEnd = new Date(date)
          targetEnd.setHours(23, 59, 59, 999)
          
          const dayEvents = data.filter(e => 
            e.dtstart >= targetStart && e.dtstart <= targetEnd
          )
          
          setEvents(dayEvents)
        }
      } catch (err) {
        console.error(err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadEvents()
    
    return () => { isMounted = false }
  }, [icsUrl, date.toISOString().split('T')[0]])

  if (!icsUrl) {
    return (
      <motion.div variants={staggerItem} className={cn("glass-card p-6 flex flex-col items-center justify-center text-center", className)}>
        <CalendarX2 className="mb-3 h-10 w-10 text-text-muted opacity-30" />
        <p className="text-sm font-medium text-text-primary">Calendário não configurado</p>
        <p className="text-xs text-text-muted mt-1">Adicione a URL do seu ICS nas Configurações.</p>
      </motion.div>
    )
  }

  return (
    <motion.div variants={staggerItem} className={cn("glass-card p-6 flex flex-col", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Calendar className="h-5 w-5 text-accent" />
          Agenda do Dia
        </h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center text-sm text-danger">
          Falha ao carregar eventos do calendário.
        </div>
      ) : events.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
          <CalendarX2 className="mb-2 h-6 w-6 opacity-30" />
          <p className="text-sm">Nenhum evento para hoje</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
          {events.slice(0, maxEvents).map((event, idx) => {
            const startTime = event.dtstart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const endTime = event.dtend.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            
            // Check if current time is within event
            const now = new Date()
            const isActive = now >= event.dtstart && now <= event.dtend
            
            return (
              <div 
                key={event.uid || idx} 
                className={cn(
                  "relative flex flex-col gap-1 rounded-lg border p-3 transition-colors",
                  isActive 
                    ? "border-accent bg-accent/5" 
                    : "border-border-subtle bg-surface hover:bg-surface-hover"
                )}
              >
                {isActive && (
                  <div className="absolute -left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-text-primary line-clamp-1 flex-1">
                    {event.summary}
                  </h4>
                  {eventTaskExists(event) ? (
                    <span title="Já importado como tarefa" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <button
                      onClick={() => importEventAsTask(event)}
                      title="Criar tarefa a partir deste evento"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <ListPlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{startTime} - {endTime}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
