import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { TaskProposal } from '@/types'

interface ProposalState {
  proposals: TaskProposal[]
  loading: boolean
  fetchProposals: () => Promise<void>
  sendProposal: (receiverEmail: string, title: string, description: string) => Promise<void>
  acceptProposal: (proposalId: string) => Promise<void>
  rejectProposal: (proposalId: string) => Promise<void>
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  loading: false,

  fetchProposals: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    set({ loading: true })

    // Busca apenas propostas pendentes enviadas para o email do usuário
    const { data, error } = await supabase
      .from('task_proposals')
      .select('*')
      .eq('receiver_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching proposals:', error)
      set({ loading: false })
      return
    }

    set({ proposals: data || [], loading: false })
  },

  sendProposal: async (receiverEmail, title, description) => {
    const user = useAuthStore.getState().user
    if (!user) {
      useToastStore.getState().addToast('Você precisa estar logado para enviar propostas.', 'error')
      return
    }

    const newProposal = {
      sender_id: user.id,
      sender_email: user.email,
      receiver_email: receiverEmail,
      title,
      description,
      status: 'pending'
    }

    const { error } = await supabase.from('task_proposals').insert([newProposal])

    if (error) {
      console.error('Error sending proposal:', error)
      useToastStore.getState().addToast('Erro ao enviar proposta de atividade.', 'error')
      throw error
    } else {
      useToastStore.getState().addToast('Proposta enviada com sucesso!', 'success')
    }
  },

  acceptProposal: async (proposalId) => {
    const { error } = await supabase
      .from('task_proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId)

    if (error) {
      console.error('Error accepting proposal:', error)
      useToastStore.getState().addToast('Erro ao aceitar proposta.', 'error')
      return
    }

    const proposal = get().proposals.find(p => p.id === proposalId)
    if (proposal) {
      // Cria a tarefa local e sincroniza pro supabase
      await useTaskStore.getState().addTask({
        id: crypto.randomUUID(),
        title: `[De ${proposal.sender_email}] ${proposal.title}`,
        description: proposal.description,
        status: 'todo',
        priority: 'p3',
        due_date: new Date().toISOString(),
        due_time: null,
        reminder_minutes: null,
        estimated_minutes: null,
        actual_minutes: null,
        parent_id: null,
        tags: ['proposta'],
        is_recurring: false,
        recurrence_rule: null,
        completed_at: null,
        position: 0,
        kanban_column: 'todo',
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: useAuthStore.getState().user?.id || null,
      })
      useToastStore.getState().addToast('Proposta aceita e adicionada às suas tarefas!', 'success')
      // Atualiza o estado local removendo a proposta
      set((state) => ({
        proposals: state.proposals.filter(p => p.id !== proposalId)
      }))
    }
  },

  rejectProposal: async (proposalId) => {
    const { error } = await supabase
      .from('task_proposals')
      .update({ status: 'rejected' })
      .eq('id', proposalId)

    if (error) {
      console.error('Error rejecting proposal:', error)
      useToastStore.getState().addToast('Erro ao recusar proposta.', 'error')
      return
    }

    useToastStore.getState().addToast('Proposta recusada.', 'info')
    // Atualiza o estado local removendo a proposta
    set((state) => ({
      proposals: state.proposals.filter(p => p.id !== proposalId)
    }))
  }
}))
