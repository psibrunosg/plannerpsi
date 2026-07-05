import { motion } from 'framer-motion'
import { Tv } from 'lucide-react'
import { pageTransition } from '@/lib/motion'
import { IptvSidebar } from '@/components/iptv/IptvSidebar'
import { IptvPlayer } from '@/components/iptv/IptvPlayer'

export default function Iptv() {
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
          <Tv className="h-8 w-8 text-accent" />
          <span className="gradient-text">IPTV Brasil</span>
        </h1>
        <p className="mt-1 text-text-secondary">Assista aos canais importados da lista IPTV Brasil 2026</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden flex-col xl:flex-row">
        {/* Sidebar for Categories & Channels */}
        <div className="hidden md:flex h-full shrink-0">
          <IptvSidebar />
        </div>

        {/* Main Content Area (Player) */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="md:hidden mb-4 h-64 shrink-0">
            <IptvSidebar />
          </div>
          
          <div className="w-full xl:max-w-4xl mx-auto flex flex-col gap-6 flex-1">
            <IptvPlayer />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
