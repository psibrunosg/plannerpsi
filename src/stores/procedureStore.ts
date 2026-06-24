import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Procedure, ProcedureStep } from '@/types'

interface ProcedureState {
  procedures: Procedure[]
  addProcedure: (procedure: Procedure) => void
  updateProcedure: (id: string, updates: Partial<Procedure>) => void
  deleteProcedure: (id: string) => void
  addStep: (procedureId: string, step: ProcedureStep) => void
  updateStep: (procedureId: string, stepId: string, updates: Partial<ProcedureStep>) => void
  deleteStep: (procedureId: string, stepId: string) => void
  reorderSteps: (procedureId: string, steps: ProcedureStep[]) => void
}

export const useProcedureStore = create<ProcedureState>()(
  persist(
    (set) => ({
      procedures: [],

      addProcedure: (procedure) => set((s) => ({
        procedures: [procedure, ...s.procedures],
      })),

      updateProcedure: (id, updates) => set((s) => ({
        procedures: s.procedures.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        ),
      })),

      deleteProcedure: (id) => set((s) => ({
        procedures: s.procedures.filter((p) => p.id !== id),
      })),

      addStep: (procedureId, step) => set((s) => ({
        procedures: s.procedures.map((p) =>
          p.id === procedureId
            ? { ...p, steps: [...p.steps, step], updated_at: new Date().toISOString() }
            : p
        ),
      })),

      updateStep: (procedureId, stepId, updates) => set((s) => ({
        procedures: s.procedures.map((p) =>
          p.id === procedureId
            ? {
                ...p,
                steps: p.steps.map((st) => st.id === stepId ? { ...st, ...updates } : st),
                updated_at: new Date().toISOString(),
              }
            : p
        ),
      })),

      deleteStep: (procedureId, stepId) => set((s) => ({
        procedures: s.procedures.map((p) =>
          p.id === procedureId
            ? {
                ...p,
                steps: p.steps
                  .filter((st) => st.id !== stepId)
                  .map((st, i) => ({ ...st, order: i })),
                updated_at: new Date().toISOString(),
              }
            : p
        ),
      })),

      reorderSteps: (procedureId, steps) => set((s) => ({
        procedures: s.procedures.map((p) =>
          p.id === procedureId
            ? { ...p, steps, updated_at: new Date().toISOString() }
            : p
        ),
      })),
    }),
    {
      name: 'planner-procedures-storage',
    }
  )
)
