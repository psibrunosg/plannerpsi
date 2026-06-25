import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, initialized: true, loading: false })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ initialized: true, loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  }
}))
