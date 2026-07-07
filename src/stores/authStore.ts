import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isRecoveryMode: boolean
  setRecoveryMode: (val: boolean) => void
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  isRecoveryMode: false,

  setRecoveryMode: (val) => set({ isRecoveryMode: val }),
  setUser: (user) => set({ user }),
  setSession: async (session) => {
    let profile = null
    if (session?.user?.id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) profile = data
    }
    set({ session, user: session?.user ?? null, profile })
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let profile = null
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) profile = data
      }
      set({ session, user: session?.user ?? null, profile, initialized: true, loading: false })

      supabase.auth.onAuthStateChange(async (event, session) => {
        let p = null
        if (session?.user?.id) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (data) p = data
        }
        set({ session, user: session?.user ?? null, profile: p })
        if (event === 'PASSWORD_RECOVERY') {
          set({ isRecoveryMode: true })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ initialized: true, loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  }
}))
