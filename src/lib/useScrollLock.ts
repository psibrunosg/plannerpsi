import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

// Locks background scroll while a modal is open. Compensates the scrollbar
// width so the page doesn't shift, and supports nested/concurrent modals
// via a shared counter (only the first lock/last unlock touch body styles).
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow
      previousPaddingRight = document.body.style.paddingRight
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }
    lockCount++

    return () => {
      lockCount--
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow
        document.body.style.paddingRight = previousPaddingRight
      }
    }
  }, [active])
}
