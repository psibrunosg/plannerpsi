import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Award, Trophy, Medal, Star, TrendingUp } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'
import { useGamificationStore } from '@/stores/gamificationStore'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function Leaderboard() {
  const profiles = useProfileStore(s => s.profiles)
  const fetchProfiles = useProfileStore(s => s.fetchProfiles)
  const calculateLevel = useGamificationStore(s => s.calculateLevel)

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Sort profiles by XP descending
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => (b.xp || 0) - (a.xp || 0))
  }, [profiles])

  const top3 = sortedProfiles.slice(0, 3)
  const others = sortedProfiles.slice(3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Leaderboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Ranking de Gamificação da Equipe</p>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-6">
        
        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="flex items-end justify-center gap-4 sm:gap-8 min-h-[250px]">
              
              {/* 2nd Place */}
              {top3[1] && (
                <motion.div variants={staggerItem} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-surface-hover border-4 border-slate-300 flex items-center justify-center mb-4 z-10 shadow-lg shadow-slate-300/20">
                    <span className="text-xl font-bold text-slate-300">{top3[1].full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-center mb-2 z-10">
                    <p className="font-semibold text-text-primary">{top3[1].full_name}</p>
                    <p className="text-sm font-medium text-slate-400">Lvl {calculateLevel(top3[1].xp || 0)}</p>
                    <p className="text-xs text-text-muted mt-1">{top3[1].xp || 0} XP</p>
                  </div>
                  <div className="w-24 h-32 bg-gradient-to-t from-slate-400/20 to-slate-300/10 rounded-t-xl border-t border-slate-300/30 flex items-start justify-center pt-4">
                    <Medal className="w-8 h-8 text-slate-300" />
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <motion.div variants={staggerItem} className="flex flex-col items-center">
                  <div className="absolute top-4">
                    <Trophy className="w-12 h-12 text-yellow-400 opacity-20 blur-sm" />
                  </div>
                  <div className="w-20 h-20 rounded-full bg-surface-hover border-4 border-yellow-400 flex items-center justify-center mb-4 z-10 shadow-xl shadow-yellow-400/20">
                    <span className="text-3xl font-bold text-yellow-400">{top3[0].full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-center mb-2 z-10">
                    <p className="font-bold text-lg text-text-primary">{top3[0].full_name}</p>
                    <p className="text-sm font-medium text-yellow-400">Lvl {calculateLevel(top3[0].xp || 0)}</p>
                    <p className="text-xs text-text-muted mt-1">{top3[0].xp || 0} XP</p>
                  </div>
                  <div className="w-28 h-40 bg-gradient-to-t from-yellow-400/20 to-yellow-400/10 rounded-t-xl border-t border-yellow-400/30 flex items-start justify-center pt-4 relative">
                    <Trophy className="w-10 h-10 text-yellow-400" />
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <motion.div variants={staggerItem} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-surface-hover border-4 border-amber-600 flex items-center justify-center mb-4 z-10 shadow-lg shadow-amber-600/20">
                    <span className="text-xl font-bold text-amber-600">{top3[2].full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-center mb-2 z-10">
                    <p className="font-semibold text-text-primary">{top3[2].full_name}</p>
                    <p className="text-sm font-medium text-amber-500">Lvl {calculateLevel(top3[2].xp || 0)}</p>
                    <p className="text-xs text-text-muted mt-1">{top3[2].xp || 0} XP</p>
                  </div>
                  <div className="w-24 h-24 bg-gradient-to-t from-amber-700/20 to-amber-600/10 rounded-t-xl border-t border-amber-600/30 flex items-start justify-center pt-4">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* List of others */}
        {others.length > 0 && (
          <motion.div variants={staggerItem} className="glass-card">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-medium text-text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-primary" />
                Demais Posições
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {others.map((profile, index) => (
                <div key={profile.id} className="p-4 flex items-center gap-4 hover:bg-surface-hover transition-colors">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm font-bold text-text-muted">
                    #{index + 4}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
                    <span className="text-sm font-medium text-text-secondary">{profile.full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{profile.full_name}</p>
                    <p className="text-xs text-text-muted">Lvl {calculateLevel(profile.xp || 0)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Star size={14} className="text-accent-primary" />
                      <span className="font-medium text-text-primary">{profile.xp || 0}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">XP Total</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  )
}