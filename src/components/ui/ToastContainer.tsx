import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toastVariants } from '@/lib/motion'
import { useToastStore } from '@/stores/toastStore'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const COLORS = {
  success: 'text-success border-success/20',
  error: 'text-danger border-danger/20',
  info: 'text-info border-info/20',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type]
          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={cn(
                'glass flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 shadow-lg',
                COLORS[toast.type]
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm text-text-primary">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 shrink-0 text-text-muted hover:text-text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
