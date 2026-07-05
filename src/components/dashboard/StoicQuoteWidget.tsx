import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Shuffle } from 'lucide-react'
import { staggerItem } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { getQuoteOfTheDay, getRandomQuote, STOIC_QUOTES } from '@/lib/stoicQuotes'

export function StoicQuoteWidget({ className }: { className?: string }) {
  const [current, setCurrent] = useState(() => {
    const quote = getQuoteOfTheDay()
    return { quote, index: STOIC_QUOTES.indexOf(quote) }
  })

  const handleShuffle = () => {
    setCurrent(getRandomQuote(current.index))
  }

  return (
    <motion.div variants={staggerItem} className={cn("glass-card p-5 flex items-start gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-purple-500/10">
        <Quote className="h-6 w-6 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm italic text-text-primary leading-relaxed">"{current.quote.quote}"</p>
            <p className="mt-2 text-xs font-medium text-text-muted">— {current.quote.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        onClick={handleShuffle}
        title="Outra citação"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-purple-400 transition-colors"
      >
        <Shuffle className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
