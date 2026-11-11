import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useGameFrame } from '../../lib/game'

/**
 * The info row above the stage: left = where you are (time, round, level, lives), middle = what to do
 * now (phase), right = how you're doing (score). `timer` (0–1, remaining) draws the thin line below.
 * Render exactly one per test, anywhere in its tree.
 */
export function GameInfo({ left, middle, right, timer }: {
  left?: ReactNode
  middle?: ReactNode
  right?: ReactNode
  timer?: number
}) {
  const { infoSlot } = useGameFrame()
  if (!infoSlot) return null
  return createPortal(
    <div className="flex h-full flex-col justify-end">
      <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-3">
        <div className="justify-self-start">{left}</div>
        <div className="text-center text-sm text-zinc-400">{middle}</div>
        <div className="justify-self-end">{right}</div>
      </div>
      <div className={`mt-1.5 h-0.5 overflow-hidden rounded-full bg-zinc-800 ${timer === undefined ? 'invisible' : ''}`}>
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(1, timer ?? 0)) * 100}%` }} />
      </div>
    </div>,
    infoSlot,
  )
}

/** A value in the info row: optional small label, the value, optional small unit. */
export function InfoValue({ label, value, unit, of }: { label?: string; value: ReactNode; unit?: string; of?: ReactNode }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      {label && <span className="mr-1.5 text-xs text-zinc-500">{label}</span>}
      <span className="text-xl font-semibold text-zinc-50">{value}</span>
      {of !== undefined && <span className="ml-1 text-xs text-zinc-500">/ {of}</span>}
      {unit && <span className="ml-1 text-xs text-zinc-400">{unit}</span>}
    </span>
  )
}

/** Lives as hearts (filled = left). */
export function Lives({ left, total }: { left: number; total: number }) {
  const l = Math.max(0, left)
  return (
    <span className="ml-2 text-sm" aria-label={`${l} of ${total} lives left`}>
      <span className="text-rose-400">{'♥ '.repeat(l)}</span>
      <span className="text-zinc-700">{'♥ '.repeat(total - l)}</span>
    </span>
  )
}
