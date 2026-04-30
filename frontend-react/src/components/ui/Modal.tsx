import type { ReactNode } from 'react'
import { Button } from './Button'

type ModalProps = {
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Modal({ children, description, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-cream p-5 text-ink shadow-2xl shadow-ink/25">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-clay">Module action</p>
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
      </div>
    </div>
  )
}
