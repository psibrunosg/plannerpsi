import { motion } from 'framer-motion'
import { BookOpen, Cloud, Download } from 'lucide-react'
import { pageTransition, staggerContainer, staggerItem } from '@/lib/motion'

export default function Study() {
  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="flex min-h-[80vh] flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Estudos</span></h1>
        <p className="mt-1 text-text-secondary">Seu ambiente focado para aulas e aprendizado</p>
      </div>

      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible"
        className="flex flex-1 flex-col items-center justify-center text-center p-8 glass-card border-dashed"
      >
        <motion.div variants={staggerItem} className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
          <BookOpen className="h-12 w-12 text-accent" />
        </motion.div>
        
        <motion.h2 variants={staggerItem} className="mb-2 text-2xl font-semibold text-text-primary">
          Suas aulas estão chegando!
        </motion.h2>
        
        <motion.p variants={staggerItem} className="mb-8 max-w-md text-text-secondary">
          Este será o seu espaço para gerenciar e assistir aulas. Em breve, você poderá adicionar seus materiais diretamente do Google Drive para estudar sem sair do Planner.
        </motion.p>
        
        <motion.button 
          variants={staggerItem}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-hover px-6 py-3 font-medium text-text-primary shadow-sm border border-border-subtle hover:bg-surface-active transition-colors opacity-80 cursor-not-allowed"
          title="Funcionalidade em desenvolvimento"
        >
          <Cloud className="h-5 w-5 text-accent" />
          Sincronizar com Google Drive
          <span className="ml-2 rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Breve</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
