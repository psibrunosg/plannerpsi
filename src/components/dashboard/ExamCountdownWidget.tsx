import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Hourglass, CalendarClock } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { fetchICSEvents } from '@/lib/icsParser'
import type { ICSEvent } from '@/lib/icsParser'
import { staggerItem } from '@/lib/motion'
import { cn } from '@/lib/cn'

const EXAM_KEYWORDS = ['prova', 'exame', 'simulado', 'avalia', 'concurso', 'residencia', 'residência']

function isExamEvent(event: ICSEvent): boolean {
  const text = `${event.summary} ${event.description || ''}`.toLowerCase()
  return EXAM_KEYWORDS.some((kw) => text.includes(kw))
}

export function ExamCountdownWidget({ className }: { className?: string }) {
  const [nextExam, setNextExam] = useState<ICSEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const icsUrl = useUIStore((s) => s.calendarIcsUrl)

  useEffect(() => {
    if (!icsUrl) return
    let isMounted = true

    fetchICSEvents(icsUrl)
      .then((events) => {
        if (!isMounted) return
        const now = new Date()
        const upcoming = events.filter((e) => e.dtstart >= now)
        const exam = upcoming.find(isExamEvent) ?? null
        setNextExam(exam)
      })
      .catch((err) => console.error('Erro ao buscar prova no calendário:', err))
      .finally(() => { if (isMounted) setLoading(false) })

    setLoading(true)
    return () => { isMounted = false }
  }, [icsUrl])

  if (!icsUrl || loading || !nextExam) return null

  const daysRemaining = Math.ceil((nextExam.dtstart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const dateStr = nextExam.dtstart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  return (
    <motion.div variants={staggerItem} className={cn("glass-card p-5 flex items-center gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-danger/10">
        <Hourglass className="h-6 w-6 text-danger" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{nextExam.summary}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
          <CalendarClock className="h-3 w-3" />
          <span>{dateStr}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold text-danger">{daysRemaining}</p>
        <p className="text-[10px] text-text-muted">dia{daysRemaining !== 1 ? 's' : ''}</p>
      </div>
    </motion.div>
  )
}
