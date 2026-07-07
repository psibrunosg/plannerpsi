import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Shuffle } from 'lucide-react'
import { staggerItem } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { getQuoteOfTheInterval, getRandomQuote, STOIC_QUOTES } from '@/lib/stoicQuotes'

export function StoicQuoteWidget({ className }: { className?: string }) {
  const [quoteData, setQuoteData] = useState(() => {
    const quote = getQuoteOfTheInterval()
    return { quote, index: STOIC_QUOTES.findIndex(q => q.quote === quote.quote) }
  })

  useEffect(() => {
    // Update the quote every minute to check if the 30-min interval has changed
    const interval = setInterval(() => {
      const newQuote = getQuoteOfTheInterval()
      if (newQuote.quote !== quoteData.quote.quote) {
        setQuoteData({ quote: newQuote, index: STOIC_QUOTES.findIndex(q => q.quote === newQuote.quote) })
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [quoteData.quote.quote])

  const handleShuffle = () => {
    setQuoteData(getRandomQuote(quoteData.index))
  }

  return (
    <motion.div variants={staggerItem} className={cn("glass-card p-5 flex items-start gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-purple-500/10">
        <Quote className="h-6 w-6 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteData.index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-1.5"
          >
            <p className="text-[13px] italic leading-relaxed text-text-secondary">"{quoteData.quote.quote}"</p>
            <p className="text-[11px] font-medium text-text-muted">— {quoteData.quote.author}</p>
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
