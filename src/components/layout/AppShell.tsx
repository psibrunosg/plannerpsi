import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { RadioPlayer } from '@/components/ui/RadioPlayer'
import { GlobalStudyMedia } from '@/components/study/GlobalStudyMedia'
import { useUIStore } from '@/stores/uiStore'
import { spring } from '@/lib/motion'

interface AppShellProps {
  children: ReactNode
  isSyncing?: boolean
}

export function AppShell({ children, isSyncing = false }: AppShellProps) {
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <motion.div
        className="flex flex-1 flex-col"
        animate={{ marginLeft: sidebarExpanded ? 260 : 72 }}
        transition={spring}
      >
        <Header isSyncing={isSyncing} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </motion.div>
      <RadioPlayer />
      <GlobalStudyMedia />
    </div>
  )
}
