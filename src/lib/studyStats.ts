import type { FocusSession } from '@/types'
import type { DriveModule, DriveTopic } from '@/lib/drive'

function toDateKey(iso: string): string {
  return iso.split('T')[0]
}

export function computeStudyStreak(sessions: { started_at: string }[]): number {
  const activeDays = new Set(sessions.map((s) => toDateKey(s.started_at)))
  let streak = 0
  const cursor = new Date()
  // Allow streak to still count if today has no session yet, as long as yesterday does
  if (!activeDays.has(cursor.toISOString().split('T')[0])) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (activeDays.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface HeatmapDay {
  date: string
  minutes: number
  weekday: number
}

// Builds a GitHub-style heatmap grid: `weeks` columns of 7 days each, ending today.
export function buildHeatmap(sessions: FocusSession[], weeks: number): HeatmapDay[][] {
  const minutesByDay = new Map<string, number>()
  for (const s of sessions) {
    const key = toDateKey(s.started_at)
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + (s.duration_minutes ?? 0))
  }

  const totalDays = weeks * 7
  const days: HeatmapDay[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - (totalDays - 1))

  for (let i = 0; i < totalDays; i++) {
    const key = cursor.toISOString().split('T')[0]
    days.push({ date: key, minutes: minutesByDay.get(key) ?? 0, weekday: cursor.getDay() })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Group into weeks (columns), each column is Sun..Sat
  const columns: HeatmapDay[][] = []
  let col: HeatmapDay[] = new Array(days[0].weekday).fill(null)
  for (const day of days) {
    col.push(day)
    if (col.length === 7) {
      columns.push(col)
      col = []
    }
  }
  if (col.length > 0) columns.push(col)
  return columns
}

export interface WeeklyHours {
  label: string
  hours: number
}

export function buildWeeklyHours(sessions: FocusSession[], weeks: number): WeeklyHours[] {
  const result: WeeklyHours[] = []
  const now = new Date()

  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    weekEnd.setHours(23, 59, 59, 999)

    const minutes = sessions
      .filter((s) => {
        const d = new Date(s.started_at)
        return d >= weekStart && d <= weekEnd
      })
      .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)

    result.push({
      label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      hours: Math.round((minutes / 60) * 10) / 10,
    })
  }

  return result
}

export interface ModuleProgress {
  id: string
  name: string
  total: number
  completed: number
}

function countModuleLessons(topics: DriveTopic[], completedLessons: string[]): { total: number; completed: number } {
  let total = 0
  let completed = 0
  for (const topic of topics) {
    total += topic.lessons.length
    completed += topic.lessons.filter((l) => completedLessons.includes(l.baseName)).length
    const nested = countModuleLessons(topic.subtopics, completedLessons)
    total += nested.total
    completed += nested.completed
  }
  return { total, completed }
}

export function computeModuleProgress(modules: DriveModule[], completedLessons: string[]): ModuleProgress[] {
  return modules
    .map((mod) => {
      const { total, completed } = countModuleLessons(mod.topics, completedLessons)
      return { id: mod.id, name: mod.name, total, completed }
    })
    .filter((m) => m.total > 0)
}
