import { useEffect, useRef, useState } from 'react'
import { shareResult } from '../lib/share'
import { Button } from './Button'

const FEEDBACK: Record<'copied' | 'failed', string> = { copied: '✓ Copied', failed: 'Could not share' }

/**
 * Share button that reports the outcome inside itself for a moment (no extra line below it,
 * so the surrounding card never changes size). The longest label is reserved in an invisible
 * copy, so the button keeps its width too.
 */
export function ShareButton({ label, getShare, variant = 'secondary', className = '' }: {
  label: string
  variant?: 'primary' | 'secondary'
  getShare: () => { text: string; url: string }
  className?: string
}) {
  const [state, setState] = useState<'copied' | 'failed' | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const share = async () => {
    const { text, url } = getShare()
    const outcome = await shareResult(text, url)
    if (outcome === 'shared' || outcome === 'cancelled') return
    setState(outcome)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(null), 2500)
  }

  return (
    <Button variant={variant} onClick={share} className={`grid ${className}`}>
      {[label, ...Object.values(FEEDBACK)].map((l) => (
        <span key={l} aria-hidden className="invisible col-start-1 row-start-1">{l}</span>
      ))}
      <span role="status" className="col-start-1 row-start-1">{state ? FEEDBACK[state] : label}</span>
    </Button>
  )
}
