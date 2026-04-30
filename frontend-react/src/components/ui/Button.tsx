import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-cream shadow-lg shadow-ink/20 hover:bg-moss',
  secondary: 'bg-cream text-ink shadow-md shadow-moss/10 hover:bg-white',
  ghost: 'bg-white/10 text-cream hover:bg-white/16',
}

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'interactive-surface inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black focus:outline-none focus:ring-4 focus:ring-clay/25 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
