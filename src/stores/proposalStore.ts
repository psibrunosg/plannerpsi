import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import type { TaskProposal } from '@/types'

interface ProposalState {
  proposals: TaskProposal[]
  loading: boolean
  processingProposalId: string | null
  fetchProposals: () => Promise<void>
  sendProposal: (receiverEmail: string, title: string, description: string) => Promise<void>
  acceptProposal: (proposalId: string) => Promise<void>
  rejectProposal: (proposalId: string) => Promise<void>
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  loading: false,
  processingProposalId: null,

  fetchProposals: async () => {
    const user = useAuthStore.getState().user
    if (!user?.email) return
    set({ loading: true })

    const { data, error } = await supabase
      .from('task_proposals')
      .select('*')
      .ilike('receiver_email', user.email.trim())
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching proposals:', error)
      useToastStore.getState().addToast('Nao foi possivel carregar as propostas recebidas.', 'error')
    }
    set({ proposals: data || [], loading: false })
  },

  sendProposal: async (receiverEmail, title, description) => {
    const user = useAuthStore.getState().user
    const normalizedEmail = receiverEmail.trim().toLowerCase()
    if (!user?.email) {
      useToastStore.getState().addToast('Voce precisa estar logado para enviar propostas.', 'error')
      return
    }

    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (recipientError || !recipient) {
      useToastStore.getState().addToast('Nenhuma conta foi encontrada para este e-mail.', 'error')
      return
    }

    const { error } = await supabase.from('task_proposals').insert([{
      sender_id: user.id,
      sender_email: user.email.toLowerCase(),
      receiver_email: recipient.email.toLowerCase(),
      title: title.trim(),
      description: description.trim() || null,
      status: 'pending',
    }])

    if (error) {
      console.error('Error sending proposal:', error)
      useToastStore.getState().addToast('Erro ao enviar proposta de atividade.', 'error')
      throw error
    }
    useToastStore.getState().addToast('Proposta enviada com sucesso!', 'success')
  },

  acceptProposal: async (proposalId) => {
    const proposal = get().proposals.find((item) => item.id === proposalId)
    if (!proposal || get().processingProposalId) return
    set({ processingProposalId: proposalId })

    try {
      await useTaskStore.getState().addTask({
        id: crypto.randomUUID(),
        title: `[De ${proposal.sender_email}] ${proposal.title}`,
        description: proposal.description,
        status: 'todo', priority: 'p3', due_date: null, due_time: null,
        reminder_minutes: null, estimated_minutes: null, actual_minutes: null,
        parent_id: null, tags: ['proposta'], is_recurring: false,
        recurrence_rule: null, completed_at: null, position: 0,
        kanban_column: 'todo', completion_percentage: 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        user_id: useAuthStore.getState().user?.id || null,
        assignee_id: useAuthStore.getState().user?.id || null,
      })

      if (useTaskStore.getState().syncStatus === 'error') return

      const { data, error } = await supabase
        .from('task_proposals')
        .update({ status: 'accepted' })
        .eq('id', proposalId)
        .eq('status', 'pending')
        .select('id')
        .single()

      if (error || !data) {
        useToastStore.getState().addToast('A tarefa foi criada, mas a proposta ainda esta pendente. Atualize a tela antes de tentar novamente.', 'error', 6000)
        return
      }

      set((state) => ({ proposals: state.proposals.filter((item) => item.id !== proposalId) }))
      useToastStore.getState().addToast('Proposta aceita e adicionada as suas tarefas!', 'success')
    } finally {
      set({ processingProposalId: null })
    }
  },

  rejectProposal: async (proposalId) => {
    if (get().processingProposalId) return
    set({ processingProposalId: proposalId })
    try {
      const { data, error } = await supabase
        .from('task_proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId)
        .eq('status', 'pending')
        .select('id')
        .single()
      if (error || !data) {
        useToastStore.getState().addToast('Nao foi possivel recusar a proposta.', 'error')
        return
      }
      set((state) => ({ proposals: state.proposals.filter((item) => item.id !== proposalId) }))
      useToastStore.getState().addToast('Proposta recusada.', 'info')
    } finally {
      set({ processingProposalId: null })
    }
  },
}))
