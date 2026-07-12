import { describe, expect, it } from 'vitest'
import { computeDelegationPulse } from '@/lib/delegationPulse'
import type { TaskProposal } from '@/types'

const proposal = (overrides: Partial<TaskProposal>): TaskProposal => ({
  id: 'proposal-1',
  sender_id: 'sender-1',
  sender_email: 'sender@example.com',
  receiver_email: 'receiver@example.com',
  title: 'Revisar documento',
  description: null,
  status: 'pending',
  created_at: '2026-07-10T12:00:00.000Z',
  ...overrides,
})

describe('computeDelegationPulse', () => {
  const now = new Date('2026-07-12T15:00:00.000Z')

  it('conta apenas propostas pendentes recebidas e enviadas', () => {
    const result = computeDelegationPulse(
      [proposal({ id: 'received-pending' }), proposal({ id: 'received-accepted', status: 'accepted' })],
      [proposal({ id: 'sent-pending' }), proposal({ id: 'sent-rejected', status: 'rejected' })],
      now,
    )

    expect(result).toEqual({ awaitingYou: 1, awaitingOthers: 1, overdueResponses: 1 })
  })

  it('considera sem resposta somente envios pendentes com mais de 48 horas', () => {
    const result = computeDelegationPulse(
      [],
      [
        proposal({ id: 'older', created_at: '2026-07-10T14:59:59.000Z' }),
        proposal({ id: 'boundary', created_at: '2026-07-10T15:00:00.000Z' }),
        proposal({ id: 'recent', created_at: '2026-07-12T14:00:00.000Z' }),
        proposal({ id: 'invalid-date', created_at: 'invalida' }),
      ],
      now,
    )

    expect(result).toEqual({ awaitingYou: 0, awaitingOthers: 4, overdueResponses: 2 })
  })
})
