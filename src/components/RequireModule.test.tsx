import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types'
import { RequireModule } from './RequireModule'

let currentProfile: Profile | null = null

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { profile: Profile | null }) => unknown) => selector({ profile: currentProfile }),
}))

function renderGuard(module: 'personal' | 'operation' | 'study' | 'clinical') {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/" element={<div>início</div>} />
        <Route path="/protected" element={<RequireModule module={module}><div>conteúdo protegido</div></RequireModule>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireModule', () => {
  beforeEach(() => {
    currentProfile = null
  })

  it('renderiza o módulo permitido', () => {
    currentProfile = { id: '1', email: 'admin@example.test', full_name: 'Admin', level: 7, app_role: 'admin' }
    renderGuard('clinical')
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })

  it('redireciona quando o papel não possui acesso', () => {
    currentProfile = { id: '2', email: 'learner@example.test', full_name: 'Aluno', level: 1, app_role: 'learner' }
    renderGuard('operation')
    expect(screen.getByText('início')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
  })
})
