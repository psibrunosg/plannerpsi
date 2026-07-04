import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import webpush from "npm:web-push@3.6.7"

interface TaskRow {
  id: string
  title: string
  due_date: string
  due_time: string | null
  user_id: string
}

interface Subscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

function nowInSaoPaulo(): { todayStr: string; nowTime: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]))
  return { todayStr: `${parts.year}-${parts.month}-${parts.day}`, nowTime: `${parts.hour}:${parts.minute}` }
}

function isOverdue(task: TaskRow, todayStr: string, nowTime: string): boolean {
  const dateStr = task.due_date.split('T')[0]
  if (dateStr < todayStr) return true
  if (dateStr === todayStr && task.due_time && task.due_time < nowTime) return true
  return false
}

serve(async (req) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET') || ''
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || ''

    if (!supabaseUrl || !supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return new Response('Server configuration error', { status: 500 })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, due_time, user_id')
      .not('due_date', 'is', null)
      .not('status', 'in', '(done,archived)')

    if (tasksError) throw tasksError

    const { todayStr, nowTime } = nowInSaoPaulo()
    const overdueTasks = (tasks || []).filter((t: TaskRow) => isOverdue(t, todayStr, nowTime))

    if (overdueTasks.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const byUser = new Map<string, TaskRow[]>()
    for (const task of overdueTasks) {
      const list = byUser.get(task.user_id) || []
      list.push(task)
      byUser.set(task.user_id, list)
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', Array.from(byUser.keys()))

    if (subsError) throw subsError

    let sent = 0
    let failed = 0

    for (const sub of (subscriptions || []) as Subscription[]) {
      const userTasks = byUser.get(sub.user_id)
      if (!userTasks || userTasks.length === 0) continue

      const payload = JSON.stringify({
        title: `${userTasks.length} tarefa${userTasks.length > 1 ? 's' : ''} atrasada${userTasks.length > 1 ? 's' : ''}`,
        body: userTasks.slice(0, 3).map(t => t.title).join(', ') + (userTasks.length > 3 ? '...' : ''),
        tag: 'overdue',
        data: { url: '/plannerpsi/#/tasks' },
      })

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: any) {
        failed++
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('push send failed', sub.id, err)
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
