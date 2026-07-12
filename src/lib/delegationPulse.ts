import type { TaskProposal } from '@/types'

const HOURS_48_IN_MS = 48 * 60 * 60 * 1000

export interface DelegationPulse {
  awaitingYou: number
  awaitingOthers: number
  overdueResponses: number
}

export function computeDelegationPulse(
  receivedProposals: TaskProposal[],
  sentProposals: TaskProposal[],
  now = new Date(),
): DelegationPulse {
  const pendingReceived = receivedProposals.filter((proposal) => proposal.status === 'pending')
  const pendingSent = sentProposals.filter((proposal) => proposal.status === 'pending')
  const overdueThreshold = now.getTime() - HOURS_48_IN_MS

  return {
    awaitingYou: pendingReceived.length,
    awaitingOthers: pendingSent.length,
    overdueResponses: pendingSent.filter((proposal) => {
      const createdAt = new Date(proposal.created_at).getTime()
      return Number.isFinite(createdAt) && createdAt <= overdueThreshold
    }).length,
  }
}
