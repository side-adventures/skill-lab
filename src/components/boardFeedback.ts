/**
 * Background of a tile board (Visual Memory, Sequence Memory, Number/Flash Order).
 * The frame and gaps turn dark green on success and dark red on a mistake (never bright: it's a large area); tiles keep their own colors.
 * Shared so every grid game gives the same feedback.
 */
export type BoardState = 'success' | 'fail' | null

export const boardBg = (state: BoardState) =>
  `transition-colors duration-150 ${
    state === 'success' ? 'bg-emerald-900' : state === 'fail' ? 'bg-rose-900' : 'bg-zinc-200 dark:bg-zinc-800'
  }`
