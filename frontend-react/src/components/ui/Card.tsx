import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  tone?: 'cream' | 'ink' | 'lagoon' | 'clay'
}

const tones = {
  cream: 'border-white/70 bg-cream/82 text-ink shadow-moss/10',
  ink: 'border-white/10 bg-ink text-cream shadow-ink/20',
  lagoon: 'border-white/20 bg-lagoon text-cream shadow-lagoon/20',
  clay: 'border-white/20 bg-clay text-cream shadow-clay/20',
}

export function Card({ children, className, tone = 'cream', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border p-5 shadow-xl backdrop-blur',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
