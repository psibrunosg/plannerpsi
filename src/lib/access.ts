import type { AppModule, Profile } from '@/types'

const ROLE_ACCESS: Record<NonNullable<Profile['app_role']>, AppModule[]> = {
  admin: ['personal', 'operation', 'study', 'clinical'],
  professional: ['personal', 'operation', 'study', 'clinical'],
  collaborator: ['personal', 'operation'],
  learner: ['personal', 'study'],
  personal: ['personal'],
}

export function hasModuleAccess(profile: Profile | null, module: AppModule): boolean {
  return ROLE_ACCESS[profile?.app_role ?? 'personal'].includes(module)
}
