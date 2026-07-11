import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { TaskProposal } from '@/types'

interface ProposalState {
  proposals: TaskProposal[]
  sentProposals: TaskProposal[]
  loading: boolean
  processingProposalId: string | null
  fetchProposals: () => Promise<void>
  sendProposal: (receiverEmail: string, title: string, description: string) => Promise<boolean>
  acceptProposal: (proposalId: string) => Promise<void>
  rejectProposal: (proposalId: string) => Promise<void>
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [], sentProposals: [], loading: false, processingProposalId: null,

  fetchProposals: async () => {
    const user = useAuthStore.getState().user
    if (!user?.email) return
    set({ loading: true })
    const [receivedResult, sentResult] = await Promise.all([
      supabase.from('task_proposals').select('*')
        .ilike('receiver_email', user.email.trim()).eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('task_proposals').select('*')
        .eq('sender_id', user.id).order('created_at', { ascending: false }),
    ])
    if (receivedResult.error || sentResult.error) {
      useToastStore.getState().addToast('Nao foi possivel carregar todas as propostas.', 'error')
    }
    set({ proposals: receivedResult.data || [], sentProposals: sentResult.data || [], loading: false })
  },

  sendProposal: async (receiverEmail, title, description) => {
    const user = useAuthStore.getState().user
    const normalizedEmail = receiverEmail.trim().toLowerCase()
    if (!user?.email) {
      useToastStore.getState().addToast('Voce precisa estar logado para enviar propostas.', 'error')
      return false
    }
    const { data: recipient, error: recipientError } = await supabase.from('profiles')
      .select('id, email').ilike('email', normalizedEmail).limit(1).maybeSingle()
    if (recipientError || !recipient) {
      useToastStore.getState().addToast('Nenhuma conta foi encontrada para este e-mail.', 'error')
      return false
    }
    const { data, error } = await supabase.from('task_proposals').insert([{
      sender_id: user.id, sender_email: user.email.toLowerCase(), receiver_email: recipient.email.toLowerCase(),
      title: title.trim(), description: description.trim() || null, status: 'pending',
    }]).select().single()
    if (error) {
      useToastStore.getState().addToast('Erro ao enviar proposta de atividade.', 'error')
      throw error
    }
    if (data) set((state) => ({ sentProposals: [data, ...state.sentProposals] }))
    useToastStore.getState().addToast('Proposta enviada com sucesso!', 'success')
    return true
  },

  acceptProposal: async (proposalId) => {
    if (get().processingProposalId) return
    set({ processingProposalId: proposalId })
    try {
      const { data, error } = await supabase.rpc('respond_to_task_proposal', {
        p_proposal_id: proposalId, p_decision: 'accepted',
      })
      if (error || !data) {
        useToastStore.getState().addToast('Nao foi possivel aceitar a proposta. Tente novamente.', 'error')
        return
      }
      await useTaskStore.getState().fetchTasks()
      set((state) => ({ proposals: state.proposals.filter((item) => item.id !== proposalId) }))
      useToastStore.getState().addToast('Proposta aceita e tarefa criada!', 'success')
    } finally {
      set({ processingProposalId: null })
    }
  },

  rejectProposal: async (proposalId) => {
    if (get().processingProposalId) return
    set({ processingProposalId: proposalId })
    try {
      const { data, error } = await supabase.rpc('respond_to_task_proposal', {
        p_proposal_id: proposalId, p_decision: 'rejected',
      })
      if (error || !data) {
        useToastStore.getState().addToast('Nao foi possivel recusar a proposta. Tente novamente.', 'error')
        return
      }
      set((state) => ({ proposals: state.proposals.filter((item) => item.id !== proposalId) }))
      useToastStore.getState().addToast('Proposta recusada.', 'info')
    } finally {
      set({ processingProposalId: null })
    }
  },
}))
