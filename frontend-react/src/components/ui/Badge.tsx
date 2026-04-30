import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BadgeProps = {
  children: ReactNode
  className?: string
  tone?: 'moss' | 'clay' | 'cream'
}

const tones = {
  moss: 'bg-moss/10 text-moss',
  clay: 'bg-clay/12 text-clay',
  cream: 'bg-cream/14 text-cream',
}

export function Badge({ children, className, tone = 'moss' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
