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
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/planning" element={<Planning />} />
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
