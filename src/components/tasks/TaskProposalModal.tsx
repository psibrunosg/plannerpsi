import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { useProposalStore } from '@/stores/proposalStore'

export function TaskProposalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const sendProposal = useProposalStore(s => s.sendProposal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !title) return
    setIsSubmitting(true)
    try {
      const sent = await sendProposal(email, title, description)
      if (!sent) return
      setEmail('')
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      // erro ja lidado na store via toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 glass-card p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-text-primary">Propor Atividade</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  E-mail do Destinatário
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface px-4 py-2 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="paciente@exemplo.com"
                  required
                />
                <p className="mt-1 text-xs text-text-muted">O destinatário deve ter uma conta no aplicativo com este e-mail.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Título da Atividade
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface px-4 py-2 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="Ex: Leitura do Capítulo 3"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface px-4 py-2 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent min-h-[100px] resize-y"
                  placeholder="Detalhes sobre a atividade..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !title}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
