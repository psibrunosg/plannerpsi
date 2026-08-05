import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Archive, Trash2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ConfirmModalVariant = 'danger' | 'warning' | 'archive' | 'info'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmModalVariant
  isLoading?: boolean
}

const variantConfig: Record<ConfirmModalVariant, { icon: React.FC<{ className?: string }>; color: string; bg: string; buttonBg: string; buttonHover: string }> = {
  danger: {
    icon: Trash2,
    color: 'text-danger',
    bg: 'bg-danger/10 border-danger/20',
    buttonBg: 'bg-danger text-white',
    buttonHover: 'hover:bg-danger-hover',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    buttonBg: 'bg-warning text-white',
    buttonHover: 'hover:bg-warning-hover',
  },
  archive: {
    icon: Archive,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    buttonBg: 'bg-accent text-white',
    buttonHover: 'hover:bg-accent-hover',
  },
  info: {
    icon: Info,
    color: 'text-info',
    bg: 'bg-info/10 border-info/20',
    buttonBg: 'bg-info text-white',
    buttonHover: 'hover:bg-info/80',
  },
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="glass relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-border/50 p-6 shadow-2xl bg-surface-elevated/95"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="flex items-start gap-4">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', config.bg)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 id="confirm-modal-title" className="text-lg font-semibold text-text-primary leading-tight">
                    {title}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="rounded-lg p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {description && (
                  <div className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                disabled={isLoading}
                className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {cancelText}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  await onConfirm()
                }}
                disabled={isLoading}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50',
                  config.buttonBg,
                  config.buttonHover
                )}
              >
                {isLoading ? 'Processando...' : confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
