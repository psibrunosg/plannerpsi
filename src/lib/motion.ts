import type { Variants, Transition } from 'framer-motion'

export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
}

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: spring },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring },
}

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springBouncy },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
}

export const sidebarVariants: Variants = {
  expanded: { width: 260, transition: spring },
  collapsed: { width: 72, transition: spring },
}

export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 80, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: springBouncy },
  exit: { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } },
}

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export const checkboxVariants: Variants = {
  unchecked: { scale: 1 },
  checked: { scale: [1, 1.3, 1], transition: { duration: 0.3 } },
}

export const dragVariants = {
  dragging: {
    scale: 1.04,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    rotate: 1.5,
    zIndex: 50,
  },
  idle: {
    scale: 1,
    boxShadow: '0 0px 0px rgba(0,0,0,0)',
    rotate: 0,
    zIndex: 0,
  },
}
