import type { Task } from '@/types'

// Store sent notifications to avoid spamming.
// We use localStorage so it persists across reloads.
const getSentLog = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem('planner_notifications_log') || '{}')
  } catch {
    return {}
  }
}

const saveSentLog = (log: Record<string, number>) => {
  localStorage.setItem('planner_notifications_log', JSON.stringify(log))
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export const checkAndNotifyTasks = async (tasks: Task[]) => {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const sentLog = getSentLog()
  let logChanged = false

  // Cleanup old logs (older than 24h)
  for (const key in sentLog) {
    if (now.getTime() - sentLog[key] > 24 * 60 * 60 * 1000) {
      delete sentLog[key]
      logChanged = true
    }
  }

  for (const task of tasks) {
    if (task.status === 'done' || task.status === 'archived') continue
    if (!task.due_date) continue

    const taskDate = task.due_date.split('T')[0]

    // Tasks without a time: overdue once the due date has fully passed (end of day).
    // Re-notify every 60 minutes via the same sentLog mechanism used below.
    if (!task.due_time) {
      const endOfDueDay = new Date(`${taskDate}T23:59:59`)
      if (now > endOfDueDay) {
        const notifKey = `overdue_${task.id}`
        const lastSent = sentLog[notifKey]
        if (!lastSent || now.getTime() - lastSent >= 60 * 60 * 1000) {
          const [y, m, d] = taskDate.split('-')
          new Notification(`Tarefa Atrasada: ${task.title}`, {
            body: `Esta tarefa venceu em ${d}/${m}/${y} e continua pendente.`,
            icon: '/plannerpsi/favicon.svg',
          })
          sentLog[notifKey] = now.getTime()
          logChanged = true
        }
      }
      continue
    }

    const [hours, minutes] = task.due_time.split(':').map(Number)

    const taskDateTime = new Date(`${taskDate}T00:00:00`)
    taskDateTime.setHours(hours, minutes, 0, 0)

    const diffMinutes = (taskDateTime.getTime() - now.getTime()) / (1000 * 60)

    let shouldNotify = false
    let title = ''
    let body = ''
    let notifKey = ''

    // Check overdue
    if (diffMinutes < 0) {
      notifKey = `overdue_${task.id}`
      const lastSent = sentLog[notifKey]
      // Remind every 60 minutes for overdue tasks
      if (!lastSent || now.getTime() - lastSent >= 60 * 60 * 1000) {
        shouldNotify = true
        title = `Tarefa Atrasada: ${task.title}`
        body = 'Esta tarefa já passou do horário previsto!'
      }
    } 
    // Check reminder
    else if (task.reminder_minutes !== null && task.reminder_minutes !== undefined) {
      // If we are within the reminder window, but haven't passed the due time
      // Example: reminder_minutes = 15. If diffMinutes is <= 15 and > 0.
      if (diffMinutes <= task.reminder_minutes) {
        notifKey = `reminder_${task.id}`
        const lastSent = sentLog[notifKey]
        // Only send reminder once
        if (!lastSent) {
          shouldNotify = true
          title = `Lembrete: ${task.title}`
          body = task.reminder_minutes === 0 
            ? 'A tarefa deve ser iniciada agora!' 
            : `Faltam ${Math.round(diffMinutes)} minutos para esta tarefa.`
        }
      }
    }

    if (shouldNotify && title) {
      new Notification(title, {
        body,
        icon: '/plannerpsi/favicon.svg',
      })
      sentLog[notifKey] = now.getTime()
      logChanged = true
    }
  }

  if (logChanged) {
    saveSentLog(sentLog)
  }
}
