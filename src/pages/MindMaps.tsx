import { motion } from 'framer-motion'
import { Network } from 'lucide-react'
import { pageTransition } from '@/lib/motion'
import { MindMapBoard } from '@/components/mindmaps/MindMapBoard'

export default function MindMaps() {
  return (
    <motion.div 
      className="flex h-[calc(100vh-6rem)] flex-col"
      variants={pageTransition} 
      initial="hidden" 
      animate="visible" 
      exit="exit"
    >
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Network className="h-8 w-8 text-accent" />
          <span className="gradient-text">Mapas Mentais</span>
        </h1>
        <p className="mt-1 text-text-secondary">Crie fluxogramas e estruturas visuais para psicoeducação e planejamento</p>
      </div>

      <div className="flex-1 w-full min-h-0 bg-surface rounded-[var(--radius-md)] shadow-sm">
        <MindMapBoard />
      </div>
    </motion.div>
  )
}
