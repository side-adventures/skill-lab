import { useEffect, type ReactNode } from 'react'
import { useLatest } from '../../lib/hooks'
import { Button } from '../Button'

/**
 * Between rounds: one big value, one line of context, optional chips with the rounds so far, and
 * "Click anywhere to continue" (any click on the page, Enter or Space; ignored for the first 300 ms
 * so the click that ended the round doesn't skip it).
 * With `button` it shows a button with that label instead (Enter / Space still work) — for tests where
 * the round ended with a button too (Eye for Geometry), so the next step is in the same place.
 */
export function RoundResult({ value, unit, line, chips, button, onContinue }: {
  value: ReactNode
  unit?: string
  line?: ReactNode
  /** Results of the rounds so far (last = this round) and the total number of rounds. */
  chips?: { done: string[]; total: number }
  button?: string
  onContinue: () => void
}) {
  const cont = useLatest(onContinue)
  useEffect(() => {
    let armed = false
    const arm = window.setTimeout(() => (armed = true), 300)
    const go = () => armed && cont.current()
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') && !e.repeat) {
        e.preventDefault()
        go()
      }
    }
    if (!button) window.addEventListener('pointerdown', go)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(arm)
      window.removeEventListener('pointerdown', go)
      window.removeEventListener('keydown', onKey)
    }
  }, [cont, button])

  return (
    <div className="text-center">
      <p className="tabular-nums">
        <span className="text-6xl font-bold tracking-tight text-zinc-50">{value}</span>
        {unit && <span className="ml-2 text-xl text-zinc-400">{unit}</span>}
      </p>
      {line && <p className="mt-1 text-zinc-400">{line}</p>}
      {chips && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: chips.total }, (_, i) => {
            const v = chips.done[i]
            const current = i === chips.done.length - 1
            return (
              <span
                key={i}
                className={`rounded-full px-2.5 py-0.5 text-xs tabular-nums ${
                  current ? 'border border-violet-500/50 bg-violet-500/20 text-violet-200'
                  : v !== undefined ? 'bg-zinc-800 text-zinc-400'
                  : 'border border-dashed border-zinc-700 text-zinc-600'
                }`}
              >
                {v ?? '–'}
              </span>
            )
          })}
        </div>
      )}
      {button ? (
        <Button onClick={() => cont.current()} className="mt-5 w-full">{button}</Button>
      ) : (
        <p className="mt-5 text-xs text-zinc-600">Click anywhere to continue</p>
      )}
    </div>
  )
}
