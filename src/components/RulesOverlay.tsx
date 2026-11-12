import { useEffect } from 'react'
import type { TestDefinition } from '../tests/types'
import { Button } from './Button'
import { RulesContent } from './RulesContent'

/**
 * The rules during a game, centered over the page. The game keeps running underneath.
 * Closes with ✕, a click outside, or Escape.
 */
export function RulesOverlay({ test, onClose, onRestart, onBackToStart }: {
  test: TestDefinition
  onClose: () => void
  onRestart: () => void
  onBackToStart: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-zinc-950/55 p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={`${test.name} rules`} className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/95 p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Rules</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="grid size-8 place-items-center rounded-lg bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <RulesContent test={test} compact />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button size="sm" onClick={onRestart}>Restart</Button>
          <Button size="sm" variant="secondary" onClick={onBackToStart}>Back to start</Button>
        </div>
      </div>
    </div>
  )
}
