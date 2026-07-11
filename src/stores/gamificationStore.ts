import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useToastStore } from '@/stores/toastStore'
import { supabase } from '@/lib/supabase'

interface GamificationState {
  xp: number
  level: number
  addXP: (amount: number, reason: string) => void
  calculateLevel: (xp: number) => number
  getXPForNextLevel: (currentLevel: number) => number
  getXPForCurrentLevel: (currentLevel: number) => number
  hydrateXP: (xp: number) => void
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,

      calculateLevel: (currentXP: number) => {
        // Fórmula simples: Nível = floor(sqrt(XP / 100)) + 1
        // Lvl 1: 0 XP
        // Lvl 2: 100 XP
        // Lvl 3: 400 XP
        // Lvl 4: 900 XP
        return Math.floor(Math.sqrt(currentXP / 100)) + 1
      },

      getXPForCurrentLevel: (level: number) => {
        return Math.pow(level - 1, 2) * 100
      },

      getXPForNextLevel: (level: number) => {
        return Math.pow(level, 2) * 100
      },

      hydrateXP: (xp) => set({ xp, level: get().calculateLevel(xp) }),

      addXP: async (amount: number, reason: string) => {
        const { xp, level, calculateLevel } = get()
        const newXP = xp + amount
        const newLevel = calculateLevel(newXP)
        
        const { data: session } = await supabase.auth.getSession()
        if (session.session?.user) {
          const { error } = await supabase.rpc('increment_xp', {
            user_id: session.session.user.id,
            amount: amount
          })
          if (error) {
            useToastStore.getState().addToast('Nao foi possivel registrar XP agora.', 'error')
            return
          }
        }
        set({ xp: newXP, level: newLevel })
        
        // Mostrar toast de XP
        useToastStore.getState().addToast(`+${amount} XP: ${reason}`, 'success')

        // Mostrar toast de Level Up se passou de nível
        if (newLevel > level) {
          setTimeout(() => {
            useToastStore.getState().addToast(`🎉 Parabéns! Você alcançou o Nível ${newLevel}!`, 'success')
          }, 1000)
        }
      },
    }),
    {
      name: 'planner-gamification',
    }
  )
)
