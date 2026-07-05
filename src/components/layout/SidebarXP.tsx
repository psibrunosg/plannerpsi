import { motion } from 'framer-motion'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useUIStore } from '@/stores/uiStore'
import { Award } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SidebarXP() {
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded)
  const { xp, level, getXPForCurrentLevel, getXPForNextLevel } = useGamificationStore()

  const currentLevelXP = getXPForCurrentLevel(level)
  const nextLevelXP = getXPForNextLevel(level)
  const progress = Math.max(0, Math.min(100, ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))

  return (
    <div className={cn("flex flex-col border-t border-border-subtle p-4 transition-all duration-300", 
      sidebarExpanded ? "items-stretch" : "items-center"
    )}>
      <div className={cn("flex items-center gap-3", sidebarExpanded ? "justify-between mb-2" : "justify-center")}>
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
            <Award className="h-4 w-4" />
            {!sidebarExpanded && (
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                {level}
              </div>
            )}
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">Lvl {level}</span>
              <span className="text-[10px] text-text-muted">{xp} XP</span>
            </div>
          )}
        </div>
      </div>

      {sidebarExpanded && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover mt-1 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full bg-accent"
          />
        </div>
      )}
    </div>
  )
}
