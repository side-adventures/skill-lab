import { useEffect, useRef, useState, type ReactNode } from 'react'
import { shareResult } from '../lib/share'
import { Button } from './Button'

type Feedback = 'copied' | 'failed' | 'empty'
const FEEDBACK: Record<Feedback, string> = { copied: '✓ Copied', failed: 'Could not share', empty: 'Play a test first' }

/**
 * Share button that reports the outcome inside itself for a moment (no extra line below it,
 * so the surrounding layout never changes size). The longest label is reserved in an invisible
 * copy, so the button keeps its width too. `getShare` may return null when there's nothing to share.
 */
export function ShareButton({ label, getShare, icon, variant = 'secondary', size = 'md', className = '' }: {
  label: string
  getShare: () => { text: string; url: string } | null
  icon?: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'sm'
  className?: string
}) {
  const [state, setState] = useState<Feedback | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (s: Feedback) => {
    setState(s)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(null), 2500)
  }

  const share = async () => {
    const data = getShare()
    if (!data) return show('empty')
    const outcome = await shareResult(data.text, data.url)
    if (outcome === 'shared' || outcome === 'cancelled') return
    show(outcome)
  }

  return (
    <Button variant={variant} size={size} onClick={share} className={`grid ${className}`}>
      {[label, ...Object.values(FEEDBACK)].map((l) => (
        <span key={l} aria-hidden className="invisible col-start-1 row-start-1 flex items-center justify-center gap-2">
          {icon}
          {l}
        </span>
      ))}
      <span role="status" className="col-start-1 row-start-1 flex items-center justify-center gap-2">
        {icon}
        {state ? FEEDBACK[state] : label}
      </span>
    </Button>
  )
}
