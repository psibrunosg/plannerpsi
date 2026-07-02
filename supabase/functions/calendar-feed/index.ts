import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

function generateICal(tasks: any[]): string {
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BS planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BS planner',
    'X-WR-CALDESC:Tarefas do BS planner'
  ]

  for (const task of tasks) {
    if (!task.due_date) continue

    const uid = `${task.id}@plannerpsi`
    const dtstamp = new Date(task.updated_at || task.created_at || new Date()).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    // Parse due_date for all-day event
    const dueDateObj = new Date(task.due_date)
    // iCal requires YYYYMMDD for VALUE=DATE
    const year = dueDateObj.getUTCFullYear()
    const month = String(dueDateObj.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dueDateObj.getUTCDate()).padStart(2, '0')
    const dtstart = `${year}${month}${day}`
    
    // For all day event, end date is next day (exclusive)
    const nextDayObj = new Date(dueDateObj)
    nextDayObj.setUTCDate(nextDayObj.getUTCDate() + 1)
    const endYear = nextDayObj.getUTCFullYear()
    const endMonth = String(nextDayObj.getUTCMonth() + 1).padStart(2, '0')
    const endDay = String(nextDayObj.getUTCDate()).padStart(2, '0')
    const dtend = `${endYear}${endMonth}${endDay}`

    const summary = task.title.replace(/(\r\n|\n|\r)/gm, " ")
    const description = (task.description || '').replace(/(\r\n|\n|\r)/gm, "\\n")
    const status = task.status === 'done' ? 'COMPLETED' : 'NEEDS-ACTION'

    ical.push('BEGIN:VEVENT')
    ical.push(`UID:${uid}`)
    ical.push(`DTSTAMP:${dtstamp}`)
    ical.push(`DTSTART;VALUE=DATE:${dtstart}`)
    ical.push(`DTEND;VALUE=DATE:${dtend}`)
    ical.push(`SUMMARY:${summary}${task.status === 'done' ? ' (Concluído)' : ''}`)
    if (description) {
      ical.push(`DESCRIPTION:${description}`)
    }
    ical.push(`STATUS:${status}`)
    ical.push('END:VEVENT')
  }

  ical.push('END:VCALENDAR')
  return ical.join('\r\n')
}

serve(async (req) => {
  try {
    const url = new URL(req.url)
    let userId = url.searchParams.get('user_id')

    // Try to parse from path if not in query, e.g., /calendar-feed/9f6651b8-fcd1-4318-abf9-6736dc2e1698.ics
    if (!userId) {
      const parts = url.pathname.split('/')
      const lastPart = parts[parts.length - 1]
      if (lastPart.endsWith('.ics')) {
        userId = lastPart.replace('.ics', '')
      }
    }

    if (!userId) {
      return new Response('Missing user_id parameter', { status: 400 })
    }

    // Initialize Supabase client with Service Role key to bypass RLS (since this is an unauthenticated feed endpoint)
    // The feed URL is secured by the unguessability of the UUID.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, due_date, created_at, updated_at')
      .eq('user_id', userId)
      .neq('status', 'archived') // Don't show archived tasks in calendar

    if (error) {
      throw error
    }

    const icalData = generateICal(tasks || [])

    return new Response(icalData, {
      headers: { 
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="plannerpsi.ics"',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    console.error(err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
