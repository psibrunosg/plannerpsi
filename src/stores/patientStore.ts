import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'
import { useAuthStore } from '@/stores/authStore'

interface PatientState {
  patients: Patient[]
  loading: boolean
  fetchPatients: () => Promise<void>
  addPatient: (patient: Partial<Patient>) => Promise<void>
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>
  deletePatient: (id: string) => Promise<void>
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  loading: false,

  fetchPatients: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name', { ascending: true })

    if (!error && data) {
      set({ patients: data, loading: false })
    } else {
      set({ loading: false })
    }
  },

  addPatient: async (patient) => {
    const user = useAuthStore.getState().user
    const newPatient = {
      ...patient,
      user_id: user?.id,
    }

    const tempId = crypto.randomUUID()
    const optimisticPatient: Patient = {
      id: tempId,
      name: patient.name || 'Sem Nome',
      email: patient.email || null,
      phone: patient.phone || null,
      document: patient.document || null,
      birth_date: patient.birth_date || null,
      notes: patient.notes || null,
      created_at: new Date().toISOString(),
      user_id: user?.id || null
    }

    set((s) => ({ patients: [...s.patients, optimisticPatient].sort((a, b) => a.name.localeCompare(b.name)) }))

    const { data, error } = await supabase.from('patients').insert(newPatient).select().single()
    if (!error && data) {
      set((s) => ({
        patients: s.patients.map((p) => p.id === tempId ? data : p)
      }))
    }
  },

  updatePatient: async (id, updates) => {
    set((s) => ({
      patients: s.patients.map((p) => p.id === id ? { ...p, ...updates } : p)
    }))
    await supabase.from('patients').update(updates).eq('id', id)
  },

  deletePatient: async (id) => {
    set((s) => ({
      patients: s.patients.filter((p) => p.id !== id)
    }))
    await supabase.from('patients').delete().eq('id', id)
  }
}))