import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TaskForm } from '@/components/tasks/TaskForm'
import Dashboard from '@/pages/Dashboard'
import Tasks from '@/pages/Tasks'
import Focus from '@/pages/Focus'
import Planning from '@/pages/Planning'
import Procedures from '@/pages/Procedures'
import Study from '@/pages/Study'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import { migrateLocalDataToSupabase } from '@/lib/migration'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useFocusStore } from '@/stores/focusStore'
import { useProcedureStore } from '@/stores/procedureStore'

export default function App() {

  const initialize = useAuthStore(s => s.initialize)
  const initialized = useAuthStore(s => s.initialized)
  const session = useAuthStore(s => s.session)

  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (session) {
      const initData = async () => {
        setIsMigrating(true)
        try {
          await migrateLocalDataToSupabase(session.user.id)
        } catch (err) {
          console.error('Migration error:', err)
        }
        await Promise.all([
          useTaskStore.getState().fetchTasks(),
          usePlanningStore.getState().fetchNotes(),
          useFocusStore.getState().fetchSessions(),
          useProcedureStore.getState().fetchProcedures()
        ])
        setIsMigrating(false)
      }
      initData()
    }
  }, [session])

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center bg-surface"><div className="text-accent animate-pulse">Carregando...</div></div>
  }

  if (!session) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <AppShell isSyncing={isMigrating}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/procedures" element={<Procedures />} />
            <Route path="/study" element={<Study />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AnimatePresence>
      </AppShell>
      <TaskForm />
      <ToastContainer />
      <CommandPalette />
    </>
  )
}
