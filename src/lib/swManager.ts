/**
 * Service Worker Manager
 * Registers the SW, requests periodicSync, and keeps it in sync with
 * the current session + tasks so background notifications work.
 */

const SW_URL = '/plannerpsi/sw.js'
const SYNC_TAG = 'check-tasks'
const SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

let swRegistration: ServiceWorkerRegistration | null = null

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  try {
    swRegistration = await navigator.serviceWorker.register(SW_URL, { scope: '/plannerpsi/' })
    console.log('[SW] Registered:', swRegistration.scope)

    // Listen for messages from SW (e.g. open task detail)
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, taskId } = event.data || {}
      if (type === 'OPEN_TASK' && taskId) {
        // Dispatch custom event that App.tsx can listen to
        window.dispatchEvent(new CustomEvent('sw:open-task', { detail: { taskId } }))
      }
    })

    await requestPeriodicSync()
  } catch (err) {
    console.warn('[SW] Registration failed:', err)
  }
}

// ─── Periodic Sync ────────────────────────────────────────────────────────────

async function requestPeriodicSync(): Promise<void> {
  if (!swRegistration) return
  if (!('periodicSync' in swRegistration)) {
    console.info('[SW] Periodic Background Sync not supported — falling back to tab-only checks.')
    return
  }

  try {
    // @ts-ignore — periodicSync is experimental
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
    if (status.state === 'granted') {
      // @ts-ignore
      await swRegistration.periodicSync.register(SYNC_TAG, {
        minInterval: SYNC_MIN_INTERVAL_MS,
      })
      console.log('[SW] Periodic sync registered — checks every 15 min.')
    } else {
      console.info('[SW] Periodic sync permission not granted.')
    }
  } catch (err) {
    console.warn('[SW] Could not register periodic sync:', err)
  }
}

// ─── Data sync helpers ────────────────────────────────────────────────────────
// Called from App.tsx whenever tasks or session change.

function sendToSW(message: object): void {
  if (!navigator.serviceWorker.controller) return
  navigator.serviceWorker.controller.postMessage(message)
}

/** Send current tasks to the SW so it can check notifications in the background. */
export function syncTasksToSW(tasks: object[]): void {
  sendToSW({ type: 'STORE_TASKS', payload: { tasks } })
}

/** Send session access token to the SW so it can fetch fresh tasks when the tab is closed. */
export function syncSessionToSW(accessToken: string): void {
  sendToSW({ type: 'STORE_SESSION', payload: { accessToken } })
}

/** Send notification settings to SW. */
export function syncSettingsToSW(notificationsEnabled: boolean): void {
  sendToSW({ type: 'STORE_SETTINGS', payload: { notificationsEnabled } })
}

/** Ask the SW to check for notifications immediately. */
export function triggerImmediateCheck(): void {
  sendToSW({ type: 'CHECK_NOW' })
}

// ─── PWA Install prompt ───────────────────────────────────────────────────────

let deferredInstallPrompt: any = null

/** Call this early (e.g. in main.tsx) to capture the install prompt. */
export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e
    // Notify any listeners
    window.dispatchEvent(new Event('sw:install-available'))
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    window.dispatchEvent(new Event('sw:installed'))
  })
}

export function canInstallPWA(): boolean {
  return !!deferredInstallPrompt
}

export async function installPWA(): Promise<boolean> {
  if (!deferredInstallPrompt) return false
  deferredInstallPrompt.prompt()
  const { outcome } = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  return outcome === 'accepted'
}

export function isRunningAsPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function getSWStatus(): 'unsupported' | 'registered' | 'unregistered' {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  return swRegistration ? 'registered' : 'unregistered'
}
