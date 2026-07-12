import { describe, expect, it } from 'vitest'
import type { AppModule, Profile, UserRole } from '@/types'
import { hasModuleAccess } from './access'

const modules: AppModule[] = ['personal', 'operation', 'study', 'clinical']
const expected: Record<UserRole, AppModule[]> = {
  admin: modules,
  professional: modules,
  collaborator: ['personal', 'operation'],
  learner: ['personal', 'study'],
  personal: ['personal'],
}

function profile(app_role: UserRole): Profile {
  return { id: app_role, email: `${app_role}@example.test`, full_name: app_role, level: 1, app_role }
}

describe('hasModuleAccess', () => {
  for (const [role, allowed] of Object.entries(expected) as [UserRole, AppModule[]][]) {
    it(`aplica a matriz do papel ${role}`, () => {
      for (const module of modules) {
        expect(hasModuleAccess(profile(role), module)).toBe(allowed.includes(module))
      }
    })
  }

  it('limita perfil ausente ao módulo pessoal', () => {
    expect(hasModuleAccess(null, 'personal')).toBe(true)
    expect(hasModuleAccess(null, 'operation')).toBe(false)
    expect(hasModuleAccess(null, 'study')).toBe(false)
    expect(hasModuleAccess(null, 'clinical')).toBe(false)
  })
})
