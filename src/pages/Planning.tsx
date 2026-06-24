import { motion } from 'framer-motion'
import { CalendarDays, Sunrise, ListChecks } from 'lucide-react'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'

export default function Planning() {
  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Planejamento</span></h1>
        <p className="mt-1 text-text-secondary">Organize seu dia e semana</p>
      </div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem} className="glass-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10">
              <Sunrise className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Ritual Matinal</h3>
              <p className="text-xs text-text-muted">Planeje seu dia</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Em breve: defina suas prioridades do dia, revise ontem, e comece focado.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-info/10">
              <ListChecks className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Revisão Semanal</h3>
              <p className="text-xs text-text-muted">Analise sua semana</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Em breve: veja estatísticas, tendências de produtividade, e planeje a próxima semana.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card col-span-full p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
              <CalendarDays className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Notas Diárias</h3>
              <p className="text-xs text-text-muted">Histórico de planejamento</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Em breve: acompanhe seu humor, anotações e evolução dia a dia.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
