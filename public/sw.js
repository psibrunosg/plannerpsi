/**
 * BS Planner — Service Worker
 * Handles background task notifications via Periodic Background Sync.
 * Works even when the planner tab is closed, as long as the browser is running.
 */

const SUPABASE_URL = 'https://vqilivjthzulevnxytyg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxaWxpdmp0aHp1bGV2bnh5dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDQ0NTQsImV4cCI6MjA5Nzk4MDQ1NH0.dHEDqVKKvRZGrcR5qMClLZwzDg7_Z6XTirf0QMyj-_M'
const PLANNER_ORIGIN = '/plannerpsi/'
const SYNC_TAG = 'check-tasks'

// ─── IndexedDB helpers ───────────────────────────────────────────────────────
// The SW can't access localStorage, so we use IndexedDB as a key-value store.

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('planner-sw-db', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('kv')
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly')
    const req = tx.objectStore('kv').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Install / Activate ──────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ─── Message from main thread ────────────────────────────────────────────────
// The main app sends tasks and settings whenever they change.

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {}

  if (type === 'STORE_TASKS') {
    await idbSet('tasks', payload.tasks)
  }
  if (type === 'STORE_SESSION') {
    await idbSet('accessToken', payload.accessToken)
  }
  if (type === 'STORE_SETTINGS') {
    await idbSet('notificationsEnabled', payload.notificationsEnabled)
  }
  // Immediate check when the page sends new data
  if (type === 'CHECK_NOW') {
    await checkAndNotifyTasks()
  }
})

// ─── Periodic Background Sync ────────────────────────────────────────────────
// Chrome/Edge will call this every ~15 min even when the tab is closed.

self.addEventListener('periodicsync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(refreshAndCheck())
  }
})

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const action = event.action
  const taskId = event.notification.data?.taskId

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find an existing planner tab
      const plannerClient = clientList.find((c) => c.url.includes('/plannerpsi'))
      if (plannerClient) {
        // Focus it and send the task id to open detail modal
        plannerClient.focus()
        if (taskId) {
          plannerClient.postMessage({ type: 'OPEN_TASK', taskId })
        }
        return
      }
      // No tab found — open a new one
      return self.clients.openWindow(PLANNER_ORIGIN)
    })
  )
})

// ─── Core logic ──────────────────────────────────────────────────────────────

/**
 * Try to refresh tasks from Supabase, then check for notifications.
 * Falls back to cached tasks if fetch fails.
 */
async function refreshAndCheck() {
  try {
    const accessToken = await idbGet('accessToken')
    if (!accessToken) {
      // No session stored — try with cached tasks only
      await checkAndNotifyTasks()
      return
    }

    // Fetch tasks directly from Supabase REST API (no SDK needed)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?select=*&status=neq.archived&status=neq.done&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (res.ok) {
      const tasks = await res.json()
      await idbSet('tasks', tasks)
    }
  } catch (err) {
    // Network error — use cached tasks
    console.warn('[SW] Could not refresh tasks:', err)
  }

  await checkAndNotifyTasks()
}

/**
 * Check cached tasks and send notifications as needed.
 */
async function checkAndNotifyTasks() {
  const notificationsEnabled = await idbGet('notificationsEnabled')
  if (notificationsEnabled === false) return

  const tasks = await idbGet('tasks')
  if (!tasks || tasks.length === 0) return

  const now = new Date()
  const sentLog = (await idbGet('sentLog')) || {}
  let logChanged = false

  // Cleanup old log entries (older than 24h)
  for (const key of Object.keys(sentLog)) {
    if (now.getTime() - sentLog[key] > 24 * 60 * 60 * 1000) {
      delete sentLog[key]
      logChanged = true
    }
  }

  for (const task of tasks) {
    if (!task || task.status === 'done' || task.status === 'archived') continue

    // ── Overdue notification (every 60min) ──────────────────────────────────
    if (task.due_date) {
      const taskDate = task.due_date.split('T')[0]
      let taskDateTime

      if (task.due_time) {
        const [h, m] = task.due_time.split(':').map(Number)
        taskDateTime = new Date(`${taskDate}T00:00:00`)
        taskDateTime.setHours(h, m, 0, 0)
      } else {
        // No time set — consider overdue after end of day
        taskDateTime = new Date(`${taskDate}T23:59:59`)
      }

      const diffMs = taskDateTime.getTime() - now.getTime()
      const diffMinutes = diffMs / (1000 * 60)

      if (diffMinutes < 0) {
        // Task is overdue
        const key = `overdue_${task.id}`
        const lastSent = sentLog[key] || 0
        const msSinceLastSent = now.getTime() - lastSent

        if (!lastSent || msSinceLastSent >= 60 * 60 * 1000) {
          const hoursLate = Math.round(Math.abs(diffMinutes) / 60)
          const lateLabel = hoursLate >= 1 ? `${hoursLate}h atrasada` : `${Math.round(Math.abs(diffMinutes))}min atrasada`

          await sendNotification({
            title: `⚠️ Tarefa Atrasada`,
            body: `"${task.title}" — ${lateLabel}`,
            tag: key,
            taskId: task.id,
            icon: '/plannerpsi/favicon.svg',
            badge: '/plannerpsi/favicon.svg',
            data: { taskId: task.id, type: 'overdue' },
            actions: [
              { action: 'open', title: 'Abrir Tarefa' },
              { action: 'dismiss', title: 'Dispensar' },
            ],
          })
          sentLog[key] = now.getTime()
          logChanged = true
        }
      }
      // ── Reminder notification (once only) ─────────────────────────────────
      else if (task.reminder_minutes !== null && task.reminder_minutes !== undefined && task.due_time) {
        if (diffMinutes >= 0 && diffMinutes <= task.reminder_minutes) {
          const key = `reminder_${task.id}`
          if (!sentLog[key]) {
            const minutesLeft = Math.round(diffMinutes)
            const timeLabel = minutesLeft <= 0
              ? 'agora'
              : minutesLeft === 1
              ? 'em 1 minuto'
              : `em ${minutesLeft} minutos`

            await sendNotification({
              title: `🔔 Lembrete: ${task.title}`,
              body: `A tarefa está prevista para ${task.due_time} — ${timeLabel}`,
              tag: key,
              taskId: task.id,
              icon: '/plannerpsi/favicon.svg',
              badge: '/plannerpsi/favicon.svg',
              data: { taskId: task.id, type: 'reminder' },
              actions: [
                { action: 'open', title: 'Abrir Tarefa' },
                { action: 'dismiss', title: 'OK' },
              ],
            })
            sentLog[key] = now.getTime()
            logChanged = true
          }
        }
      }
    }
  }

  if (logChanged) {
    await idbSet('sentLog', sentLog)
  }
}

async function sendNotification({ title, body, tag, icon, badge, data, actions }) {
  // Check permission (SW context)
  if (self.Notification?.permission !== 'granted') return

  await self.registration.showNotification(title, {
    body,
    tag,
    icon,
    badge,
    data,
    actions,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  })
}
