import { supabase } from '@/lib/supabase'
import { useTaskStore } from '@/stores/taskStore'
import { useProposalStore } from '@/stores/proposalStore'
import { useAuthStore } from '@/stores/authStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

let realtimeChannel: RealtimeChannel | null = null
let lastSyncTimestamp = 0
let syncTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Executes a synchronized refetch of primary dynamic data (tasks, proposals)
 * throttled so it doesn't spam network if multiple triggers fire rapidly.
 */
export async function resynchronizeData(force = false) {
  const now = Date.now()
  // Ignore duplicate sync triggers within 10 seconds unless forced
  if (!force && now - lastSyncTimestamp < 10_000) {
    return
  }

  const user = useAuthStore.getState().user
  if (!user) return

  lastSyncTimestamp = now

  // Refetch concurrently to restore convergence across devices
  await Promise.allSettled([
    useTaskStore.getState().fetchTasks(),
    useProposalStore.getState().fetchProposals()
  ])
}

/**
 * Schedules a debounced synchronization after a Realtime event arrives.
 */
function scheduleDebouncedSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
  syncTimeout = setTimeout(() => {
    resynchronizeData(true)
  }, 600)
}

/**
 * Initializes Supabase WebSocket Realtime subscriptions and Browser Lifecycles
 * for reliable multi-device task synchronization.
 */
export function initializeDeviceSync() {
  // 1. Clean up any prior existing subscription
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  const user = useAuthStore.getState().user
  if (!user) return

  // 2. Subscribe to postgres_changes on dynamic tables
  realtimeChannel = supabase
    .channel('global_device_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      () => {
        scheduleDebouncedSync()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'task_proposals' },
      () => {
        scheduleDebouncedSync()
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn('[SyncManager] Realtime subscription notice:', err)
      } else if (status === 'SUBSCRIBED') {
        console.log('[SyncManager] Realtime sync channel active')
      }
    })

  // 3. Setup Window / Document Visibility Recovery (Stale tab fix)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resynchronizeData()
      }
    }

    const handleWindowFocus = () => {
      resynchronizeData()
    }

    const handleOnline = () => {
      resynchronizeData(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })
    window.addEventListener('focus', handleWindowFocus, { passive: true })
    window.addEventListener('online', handleOnline, { passive: true })

    // Return cleanup function if needed by callers
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('online', handleOnline)
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
      }
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }
}
