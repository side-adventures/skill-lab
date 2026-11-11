import { useState, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { useInfoWidthOf } from '../../lib/game'

/**
 * The four layouts every test is built from. They all fill the fixed stage (768 × 512).
 *
 * - FullLayout: one area fills the whole stage, no padding (Reaction, Aim Trainer, Line Tracing …).
 * - PromptLayout: a box with a large display on top and an answer strip at the bottom (Stroop, Mental Math …).
 * - SquareLayout: one square (or other fixed-ratio) board at full height, no box; the info row matches its width.
 * - SquarePanelLayout: a box with the square board on the left and a panel on the right (N-Back, Quick Count …).
 */

/** One area that is the whole stage. Pass the area's own classes (background, cursor) and handlers. */
export function FullLayout({ className = '', children, ref, ...rest }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={`play-area relative size-full overflow-hidden rounded-2xl ${className}`} {...rest}>
      {children}
    </div>
  )
}

const BOX = 'size-full rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4'

/** Large display (takes the remaining height) + an answer strip (buttons or keypad) at the bottom. */
export function PromptLayout({ display, answers, displayClassName = '' }: {
  display: ReactNode
  answers: ReactNode
  /** Extra classes for the display surface (e.g. the answer flash ring, a background color). */
  displayClassName?: string
}) {
  return (
    <div className={`flex flex-col gap-4 ${BOX}`}>
      <div className={`grid min-h-0 flex-1 place-items-center rounded-xl bg-zinc-950/70 ${displayClassName}`}>{display}</div>
      <div className="play-area shrink-0">{answers}</div>
    </div>
  )
}

/** A board with a fixed aspect ratio (default square) at full stage height, centered, no box. */
export function SquareLayout({ aspect = 1, children }: { aspect?: number; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  useInfoWidthOf(el)
  return (
    <div className="relative size-full">
      <div ref={setEl} className="absolute inset-y-0 left-1/2 h-full -translate-x-1/2" style={{ aspectRatio: aspect }}>
        {children}
      </div>
    </div>
  )
}

/** Square board on the left at full height, a panel on the right, both in one box. */
export function SquarePanelLayout({ board, panel, boardClassName = '' }: {
  board: ReactNode
  panel: ReactNode
  boardClassName?: string
}) {
  return (
    <div className={`flex gap-5 ${BOX}`}>
      <div className={`play-area relative aspect-square h-full shrink-0 overflow-hidden rounded-xl bg-zinc-950/70 ${boardClassName}`} style={{ touchAction: 'none' }}>
        {board}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{panel}</div>
    </div>
  )
}
