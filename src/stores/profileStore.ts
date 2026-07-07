import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface ProfileState {
  profiles: Profile[]
  loading: boolean
  fetchProfiles: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: [],
  loading: false,

  fetchProfiles: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      if (data) {
        set({ profiles: data as Profile[] })
      }
    } catch (err) {
      console.error('Error fetching profiles:', err)
    } finally {
      set({ loading: false })
    }
  }
}))
