/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', () => {
  self.clients.claim()
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'PlannerPSI', {
      body: data.body,
      tag: data.tag ?? 'plannerpsi',
      icon: '/plannerpsi/pwa-192.png',
      badge: '/plannerpsi/pwa-192.png',
      data: data.data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/plannerpsi/#/tasks'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes('/plannerpsi/'))
      if (existing) {
        existing.focus()
        return (existing as WindowClient).navigate(url)
      }
      return self.clients.openWindow(url)
    })
  )
})
