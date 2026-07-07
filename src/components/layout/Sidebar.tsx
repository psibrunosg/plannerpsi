import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  CalendarDays,
  ClipboardList,
  Settings,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  BarChart3,
  Network,
  Users,
  Trophy
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { sidebarVariants } from '@/lib/motion'
import { useUIStore } from '@/stores/uiStore'
import { SidebarXP } from '@/components/layout/SidebarXP'

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { path: '/focus', icon: Timer, label: 'Foco' },
  { path: '/planning', icon: CalendarDays, label: 'Planejamento' },
  { path: '/procedures', icon: ClipboardList, label: 'Procedimentos' },
  { path: '/patients', icon: Users, label: 'Pacientes' },
  { path: '/leaderboard', icon: Trophy, label: 'Ranking (XP)' },
  { path: '/study', icon: BookOpen, label: 'Estudos' },
  { path: '/maps', icon: Network, label: 'Mapas' },
  { path: '/stats', icon: BarChart3, label: 'Estatísticas' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <motion.aside
      className="glass fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-subtle"
      variants={sidebarVariants}
      animate={sidebarExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)]">
          <img 
            src={`${import.meta.env.BASE_URL}logo.png`} 
            alt="BS planner logo" 
            className="h-full w-full object-cover"
          />
        </div>
        {sidebarExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="gradient-text text-base font-heading font-semibold tracking-tight leading-tight"
          >
            Clínica BS
          </motion.span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
              {active && sidebarExpanded && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      <SidebarXP />
      <div className="border-t border-border-subtle p-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-[var(--radius-sm)] p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </motion.button>
      </div>
    </motion.aside>
  )
}
