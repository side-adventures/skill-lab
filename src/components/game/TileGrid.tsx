import type { ReactNode } from 'react'
import { boardBg, type BoardState } from '../boardFeedback'

export type TileTone = 'idle' | 'lit' | 'found' | 'wrong' | 'hint' | 'revealed' | 'hidden' | 'done' | 'empty'

const TONE: Record<TileTone, string> = {
  idle: 'bg-zinc-700',
  lit: 'bg-violet-500',
  found: 'bg-violet-500',
  wrong: 'bg-rose-700',
  hint: 'bg-violet-500/35 ring-2 ring-inset ring-violet-400',
  revealed: 'bg-zinc-100 text-zinc-900',
  hidden: 'bg-violet-500',
  done: 'bg-violet-500/25 text-violet-200',
  empty: 'bg-transparent',
}

/**
 * How `frame` (success / fail) shows on the board — being compared:
 * - 'fill': the board background (frame + gaps) turns dark green / red.
 * - 'ring': a faint green / red ring around the board, like the answer flash on Word Memory.
 * - 'tint': a very transparent green / red layer over the whole board, tiles included.
 */
export type FrameStyle = 'fill' | 'ring' | 'tint'

const RING: Record<NonNullable<BoardState>, string> = { success: 'ring-emerald-400/60', fail: 'ring-rose-400/65' }
const TINT: Record<NonNullable<BoardState>, string> = { success: 'bg-emerald-400/5', fail: 'bg-rose-400/5' }

/**
 * A grid of tiles that fills its parent (Visual / Sequence Memory, N-Back, Number / Flash Order).
 * `tile(i)` gives each tile's tone and optional content; `frame` marks the board green / red (see FrameStyle).
 */
export function TileGrid({ cols, rows = cols, tile, onTap, frame = null, frameStyle = 'fill', gap = 'gap-2' }: {
  cols: number
  rows?: number
  tile: (i: number) => { tone: TileTone; content?: ReactNode; label?: string }
  onTap?: (i: number) => void
  frame?: BoardState
  frameStyle?: FrameStyle
  gap?: string
}) {
  const look =
    frameStyle === 'fill' ? boardBg(frame)
    : `bg-zinc-800 ${frameStyle === 'ring' ? `ring-2 transition-shadow duration-150 ${frame ? RING[frame] : 'ring-transparent'}` : ''}`
  return (
    <div
      className={`play-area relative grid size-full rounded-2xl p-2 ${gap} ${look}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * rows }, (_, i) => {
        const t = tile(i)
        return (
          <button
            key={i}
            type="button"
            aria-label={t.label ?? `Tile ${i + 1}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              onTap?.(i)
            }}
            className={`grid min-h-0 place-items-center overflow-hidden rounded-lg text-2xl leading-none font-bold transition-colors duration-150 ${TONE[t.tone]} ${onTap ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {t.content}
          </button>
        )
      })}
      {frameStyle === 'tint' && (
        <div className={`pointer-events-none absolute inset-0 rounded-2xl transition-colors duration-150 ${frame ? TINT[frame] : 'bg-transparent'}`} />
      )}
    </div>
  )
}
