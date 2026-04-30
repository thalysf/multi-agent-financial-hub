import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from './Button'

type ModalProps = {
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Modal({ children, description, isOpen, onClose, title }: ModalProps) {
  const shouldReduceMotion = useReducedMotion()
  const overlayTransition = { duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] } as const
  const panelTransition = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({ type: 'spring', stiffness: 150, damping: 22, mass: 0.9 } as const)

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="dialog"
          transition={overlayTransition}
        >
          <motion.div
            animate={{ filter: 'blur(0px)', opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-cream p-5 text-ink shadow-2xl shadow-ink/25"
            exit={{ filter: 'blur(8px)', opacity: 0, scale: 0.96, y: 28 }}
            initial={{ filter: 'blur(10px)', opacity: 0, scale: 0.96, y: 34 }}
            transition={panelTransition}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-clay">
                  Module action
                </p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.08em]">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
                ) : null}
              </div>
              <Button className="px-4 py-2" onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
