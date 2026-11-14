import type { ReactNode } from 'react'
import { feedbackRing } from '../../lib/game'

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

/** Success / fail state of a whole board: shown as the shared feedback ring around it. */
export type BoardState = 'success' | 'fail' | null

/**
 * A grid of tiles that fills its parent (Pattern / Sequence Memory, N-Back, Number / Flash Order).
 * `tile(i)` gives each tile's tone and optional content; `frame` puts a green / red ring around the board.
 * `instant` turns off the color fade, so a tile that goes dark and lights again right away shows two clear flashes.
 */
export function TileGrid({ cols, rows = cols, tile, onTap, frame = null, gap = 'gap-2', instant = false }: {
  cols: number
  rows?: number
  tile: (i: number) => { tone: TileTone; content?: ReactNode; label?: string }
  onTap?: (i: number) => void
  frame?: BoardState
  gap?: string
  instant?: boolean
}) {
  return (
    <div
      className={`play-area relative grid size-full rounded-2xl p-2 ${gap} bg-zinc-800 ${feedbackRing(frame === 'success' ? 'ok' : frame === 'fail' ? 'bad' : null)}`}
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
            className={`grid min-h-0 place-items-center overflow-hidden rounded-lg text-2xl leading-none font-bold ${instant ? '' : 'transition-colors duration-150'} ${TONE[t.tone]} ${onTap ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {t.content}
          </button>
        )
      })}
    </div>
  )
}
