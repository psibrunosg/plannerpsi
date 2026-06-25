import { supabase } from './supabase'
import type { Task, DailyNote, FocusSession, Procedure } from '@/types'

export async function migrateLocalDataToSupabase(userId: string) {
  let migratedItems = 0

  try {
    // 1. Migrate Tasks
    const tasksRaw = localStorage.getItem('planner-tasks-storage')
    if (tasksRaw) {
      const parsed = JSON.parse(tasksRaw)
      if (parsed?.state?.tasks?.length > 0) {
        const localTasks: Task[] = parsed.state.tasks
        const tasksToMigrate = localTasks.filter(t => !t.user_id)
        
        if (tasksToMigrate.length > 0) {
          const { error } = await supabase.from('tasks').insert(
            tasksToMigrate.map(t => ({ ...t, user_id: userId }))
          )
          if (!error) {
            migratedItems += tasksToMigrate.length
            // Update local storage to mark as migrated
            parsed.state.tasks = localTasks.map(t => ({ ...t, user_id: userId }))
            localStorage.setItem('planner-tasks-storage', JSON.stringify(parsed))
          } else {
            console.error('Task migration error:', error)
          }
        }
      }
    }

    // 2. Migrate Daily Notes
    const notesRaw = localStorage.getItem('planner-planning-storage')
    if (notesRaw) {
      const parsed = JSON.parse(notesRaw)
      if (parsed?.state?.notes?.length > 0) {
        const localNotes: DailyNote[] = parsed.state.notes
        // Notes don't have user_id in the frontend type, but they do in DB.
        // If they are in localStorage, they were local.
        // To avoid duplicate migrations, we will just delete the local storage after or check if they already exist.
        // Actually, let's just insert and catch duplicates if any, but UUIDs are random.
        
        // Wait, localNotes don't have user_id property in TS, but we add it for insert
        const { error } = await supabase.from('daily_notes').insert(
          localNotes.map((n: any) => ({ ...n, user_id: userId }))
        )
        if (!error) {
          migratedItems += localNotes.length
          // Clear local notes after migration to avoid duplicate insertions on reload
          parsed.state.notes = []
          localStorage.setItem('planner-planning-storage', JSON.stringify(parsed))
        }
      }
    }

    // 3. Migrate Focus Sessions
    const focusRaw = localStorage.getItem('planner-focus-storage')
    if (focusRaw) {
      const parsed = JSON.parse(focusRaw)
      if (parsed?.state?.sessions?.length > 0) {
        const localSessions: FocusSession[] = parsed.state.sessions
        const { error } = await supabase.from('focus_sessions').insert(
          localSessions.map((s: any) => ({ ...s, user_id: userId }))
        )
        if (!error) {
          migratedItems += localSessions.length
          parsed.state.sessions = []
          localStorage.setItem('planner-focus-storage', JSON.stringify(parsed))
        }
      }
    }

    // 4. Migrate Procedures
    const procRaw = localStorage.getItem('planner-procedures-storage')
    if (procRaw) {
      const parsed = JSON.parse(procRaw)
      if (parsed?.state?.procedures?.length > 0) {
        const localProcs: Procedure[] = parsed.state.procedures
        
        for (const proc of localProcs) {
          const { steps, ...procData } = proc
          
          // Insert procedure
          const { error: pErr } = await supabase.from('procedures').insert({
            ...procData,
            user_id: userId
          })
          
          if (!pErr) {
            migratedItems++
            // Insert steps
            if (steps && steps.length > 0) {
              await supabase.from('procedure_steps').insert(
                steps.map(s => ({ ...s, procedure_id: proc.id }))
              )
            }
          }
        }
        parsed.state.procedures = []
        localStorage.setItem('planner-procedures-storage', JSON.stringify(parsed))
      }
    }

    return migratedItems
  } catch (err) {
    console.error('Migration failed:', err)
    return 0
  }
}
