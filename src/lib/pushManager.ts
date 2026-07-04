import { supabase } from '@/lib/supabase'

// Public VAPID key — safe to ship in client code (it identifies the sender, not a secret).
const VAPID_PUBLIC_KEY = 'BFeq32A3HlW_maM5-HRGWbd8i5WBB7YgvcFS4VM59Ivv_qyJw96BAxgV742ytKBXjvY_FcMvekrDayLVDhMhvdU'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function getPushStatus(): Promise<'unsupported' | 'subscribed' | 'unsubscribed'> {
  if (!isPushSupported()) return 'unsupported'
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return subscription ? 'subscribed' : 'unsubscribed'
}

export async function subscribeToPush(userId: string): Promise<void> {
  if (!isPushSupported()) throw new Error('Push não suportado neste navegador.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permissão de notificação negada.')

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
