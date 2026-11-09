import { useEffect, useState } from 'react'
import { DrainBar } from '../../components/DrainBar'
import { boardBg } from '../../components/boardFeedback'
import type { TestResult } from '../types'
import { COLS, ROWS, placeTiles } from './scoring'

type Phase = 'show' | 'hidden' | 'success' | 'fail'

interface Props {
  tilesFor: (round: number) => number
  memorizeMsFor: (round: number) => number
  /** Builds the result from the number of cleared rounds when a wrong tile is tapped. */
  result: (clearedRounds: number) => TestResult
  roundLabel: (round: number) => string
  onFinish: (r: TestResult) => void
}

/**
 * Shared game for Number Order and Flash Order: numbers 1..N appear on a grid,
 * hide after a timer (or when you tap "1"), then you tap them in order. One mistake ends it.
 */
export function OrderGame({ tilesFor, memorizeMsFor, result, roundLabel, onFinish }: Props) {
  const [round, setRound] = useState(0)
  const [cells, setCells] = useState(() => placeTiles(tilesFor(0)))
  const [phase, setPhase] = useState<Phase>('show')
  const [next, setNext] = useState(0) // index of the number to tap next
  const [wrongCell, setWrongCell] = useState<number | null>(null)
  const memorizeMs = memorizeMsFor(round)

  useEffect(() => {
    let t: number | undefined
    if (phase === 'show') t = window.setTimeout(() => setPhase('hidden'), memorizeMs)
    if (phase === 'success')
      t = window.setTimeout(() => {
        setRound(round + 1)
        setCells(placeTiles(tilesFor(round + 1)))
        setNext(0)
        setPhase('show')
      }, 700)
    if (phase === 'fail') t = window.setTimeout(() => onFinish(result(round)), 1800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const tap = (cell: number) => {
    if (phase !== 'show' && phase !== 'hidden') return
    const index = cells.indexOf(cell)
    if (index === -1) return // empty cell: ignore
    if (phase === 'show' && index !== 0) return // while visible, only "1" starts the answer
    if (index !== next) {
      setWrongCell(cell)
      return setPhase('fail')
    }
    if (phase === 'show') setPhase('hidden')
    if (next + 1 === cells.length) setPhase('success')
    setNext(next + 1)
  }

  const message =
    phase === 'show' ? 'Memorize — tap 1 when you are ready'
    : phase === 'hidden' ? `Tap the numbers in order (${next} / ${cells.length})`
    : phase === 'success' ? 'Correct!'
    : 'Wrong tile'

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm text-zinc-500">
        <span>{roundLabel(round)}</span>
        <span>{cells.length} tiles · {(memorizeMs / 1000).toFixed(memorizeMs < 1000 ? 2 : 1)} s</span>
      </div>
      <div className="mb-2 h-1.5">{phase === 'show' && <DrainBar key={round} ms={memorizeMs} />}</div>
      <p className="mb-3 text-center font-medium" role="status">{message}</p>
      <div
        className={`play-area mx-auto grid w-full max-w-[520px] gap-1.5 rounded-2xl p-2 sm:gap-2 ${
          boardBg(phase === 'success' ? 'success' : phase === 'fail' ? 'fail' : null)
        }`}
        // Fixed rows + columns: tiles keep their size whether they show a number or not.
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          aspectRatio: `${COLS} / ${ROWS}`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, cell) => {
          const index = cells.indexOf(cell)
          if (index === -1) return <div key={cell} onPointerDown={() => tap(cell)} />
          const done = index < next
          const reveal = phase === 'show' || phase === 'fail'
          return (
            <button
              key={cell}
              type="button"
              aria-label={reveal ? String(index + 1) : 'Hidden tile'}
              onPointerDown={() => tap(cell)}
              className={`grid min-h-0 place-items-center overflow-hidden rounded-lg text-xl leading-none font-bold sm:text-2xl ${
                wrongCell === cell ? 'bg-rose-500 text-white'
                : done ? 'bg-violet-500/30 text-violet-700 dark:text-violet-300'
                : reveal ? 'bg-white text-zinc-900 dark:bg-zinc-100'
                : 'bg-violet-500'
              }`}
            >
              {(reveal || done) && index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
