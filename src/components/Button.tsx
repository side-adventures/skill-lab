import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'sm'

const styles: Record<Variant, string> = {
  primary: 'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700',
  secondary:
    'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
}
const sizes: Record<Size, string> = {
  md: 'rounded-xl px-5 py-3',
  sm: 'rounded-lg px-3 py-1.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50 ${sizes[size]} ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
