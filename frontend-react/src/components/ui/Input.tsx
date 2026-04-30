import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-ink/10 bg-white/72 px-4 py-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/38 focus:border-moss/40 focus:bg-white focus:ring-4 focus:ring-moss/10',
        className,
      )}
      {...props}
    />
  )
}
