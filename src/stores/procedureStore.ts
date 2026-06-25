import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Procedure, ProcedureStep } from '@/types'

interface ProcedureState {
  procedures: Procedure[]
  loading: boolean
  setProcedures: (procedures: Procedure[]) => void
  fetchProcedures: () => Promise<void>
  addProcedure: (procedure: Procedure) => Promise<void>
  updateProcedure: (id: string, updates: Partial<Procedure>) => Promise<void>
  deleteProcedure: (id: string) => Promise<void>
  addStep: (procedureId: string, step: ProcedureStep) => Promise<void>
  updateStep: (procedureId: string, stepId: string, updates: Partial<ProcedureStep>) => Promise<void>
  deleteStep: (procedureId: string, stepId: string) => Promise<void>
  reorderSteps: (procedureId: string, steps: ProcedureStep[]) => Promise<void>
}

export const useProcedureStore = create<ProcedureState>()(
  persist(
    (set) => ({
      procedures: [],
      loading: false,

      setProcedures: (procedures) => set({ procedures }),

      fetchProcedures: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        set({ loading: true })
        
        const { data, error } = await supabase
          .from('procedures')
          .select('*, steps:procedure_steps(*)')
          .order('created_at', { ascending: false })
          
        if (!error && data) {
          // Sort steps by order
          const procs = data.map(p => ({
            ...p,
            steps: (p.steps || []).sort((a: any, b: any) => a.order - b.order)
          }))
          set({ procedures: procs, loading: false })
        } else {
          set({ loading: false })
        }
      },

      addProcedure: async (procedure) => {
        set((s) => ({ procedures: [procedure, ...s.procedures] }))
        const user = useAuthStore.getState().user
        if (user) {
          const { steps, ...procData } = procedure
          const { error } = await supabase.from('procedures').insert({ ...procData, user_id: user.id })
          if (error) console.error('Error saving procedure:', error)
          else if (steps.length > 0) {
            await supabase.from('procedure_steps').insert(
              steps.map(s => ({ ...s, procedure_id: procedure.id }))
            )
          }
        }
      },

      updateProcedure: async (id, updates) => {
        const updated_at = new Date().toISOString()
        set((s) => ({
          procedures: s.procedures.map((p) => p.id === id ? { ...p, ...updates, updated_at } : p),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('procedures').update({ ...updates, updated_at }).eq('id', id)
          if (error) console.error('Error updating procedure:', error)
        }
      },

      deleteProcedure: async (id) => {
        set((s) => ({ procedures: s.procedures.filter((p) => p.id !== id) }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('procedures').delete().eq('id', id)
          if (error) console.error('Error deleting procedure:', error)
        }
      },

      addStep: async (procedureId, step) => {
        set((s) => ({
          procedures: s.procedures.map((p) =>
            p.id === procedureId ? { ...p, steps: [...p.steps, step], updated_at: new Date().toISOString() } : p
          ),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('procedure_steps').insert({ ...step, procedure_id: procedureId })
          if (error) console.error('Error adding step:', error)
        }
      },

      updateStep: async (procedureId, stepId, updates) => {
        set((s) => ({
          procedures: s.procedures.map((p) => p.id === procedureId ? {
            ...p,
            steps: p.steps.map((st) => st.id === stepId ? { ...st, ...updates } : st),
            updated_at: new Date().toISOString(),
          } : p),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('procedure_steps').update(updates).eq('id', stepId)
          if (error) console.error('Error updating step:', error)
        }
      },

      deleteStep: async (procedureId, stepId) => {
        set((s) => ({
          procedures: s.procedures.map((p) => p.id === procedureId ? {
            ...p,
            steps: p.steps.filter((st) => st.id !== stepId).map((st, i) => ({ ...st, order: i })),
            updated_at: new Date().toISOString(),
          } : p),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase.from('procedure_steps').delete().eq('id', stepId)
          if (error) console.error('Error deleting step:', error)
          // Ideally should also reorder on DB but local state handles it nicely for now
        }
      },

      reorderSteps: async (procedureId, steps) => {
        set((s) => ({
          procedures: s.procedures.map((p) => p.id === procedureId ? { ...p, steps, updated_at: new Date().toISOString() } : p),
        }))
        const user = useAuthStore.getState().user
        if (user) {
          // Update orders in DB
          for (const step of steps) {
            await supabase.from('procedure_steps').update({ order: step.order }).eq('id', step.id)
          }
        }
      },
    }),
    {
      name: 'planner-procedures-storage',
      partialize: (state) => ({ procedures: state.procedures }),
    }
  )
)
