import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TaskForm } from '@/components/tasks/TaskForm'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import UpdatePassword from '@/pages/UpdatePassword'

// Lazy-loaded: only Dashboard (the landing page) ships in the initial bundle
const Tasks = lazy(() => import('@/pages/Tasks'))
const Focus = lazy(() => import('@/pages/Focus'))
const Planning = lazy(() => import('@/pages/Planning'))
const Procedures = lazy(() => import('@/pages/Procedures'))
const Study = lazy(() => import('@/pages/Study'))
const Stats = lazy(() => import('@/pages/Stats'))
const Settings = lazy(() => import('@/pages/Settings'))
import { migrateLocalDataToSupabase } from '@/lib/migration'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useFocusStore } from '@/stores/focusStore'
import { useProcedureStore } from '@/stores/procedureStore'
import { useRadioStore } from '@/stores/radioStore'
import { requestNotificationPermission, checkAndNotifyTasks } from '@/lib/notificationManager'
import { handleCallbackIfPresent } from '@/lib/spotifyAuth'

export default function App() {

  const initialize = useAuthStore(s => s.initialize)
  const initialized = useAuthStore(s => s.initialized)
  const session = useAuthStore(s => s.session)
  const isRecoveryMode = useAuthStore(s => s.isRecoveryMode)

  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    initialize()
    handleCallbackIfPresent()
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
          useFocusStore.getState().loadPreferencesFromDB(),
          useProcedureStore.getState().fetchProcedures(),
          useRadioStore.getState().loadFavoritesFromDB()
        ])
        setIsMigrating(false)
      }
      initData()

      requestNotificationPermission()
      
      const interval = setInterval(() => {
        const tasks = useTaskStore.getState().tasks
        if (tasks.length > 0) {
          checkAndNotifyTasks(tasks)
        }
      }, 60 * 1000) // check every 1 minute
      
      return () => clearInterval(interval)
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

  if (isRecoveryMode) {
    return (
      <>
        <UpdatePassword />
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <AppShell isSyncing={isMigrating}>
        <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="text-accent animate-pulse">Carregando...</div></div>}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/focus" element={<Focus />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/procedures" element={<Procedures />} />
              <Route path="/study" element={<Study />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </AppShell>
      <TaskForm />
      <ToastContainer />
      <CommandPalette />
    </>
  )
}
