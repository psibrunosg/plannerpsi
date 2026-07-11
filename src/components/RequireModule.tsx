import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { AppModule } from '@/types'
import { hasModuleAccess } from '@/lib/access'
import { useAuthStore } from '@/stores/authStore'

export function RequireModule({ module, children }: { module: AppModule; children: ReactNode }) {
  const profile = useAuthStore((state) => state.profile)
  return hasModuleAccess(profile, module) ? <>{children}</> : <Navigate to="/" replace />
}
