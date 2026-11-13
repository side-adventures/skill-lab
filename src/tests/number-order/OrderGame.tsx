import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { TileGrid } from '../../components/game/TileGrid'
import { END_MOMENT_MS } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestResult } from '../types'
import { COLS, ROWS, placeTiles } from './scoring'

type Phase = 'show' | 'hidden' | 'success' | 'fail'

/** What the run measured, for the result stats. */
export interface OrderRunStats {
  /** Per round: how long the numbers stayed visible (clicking 1 early ends it). */
  memorizeUsed: { round: number; ms: number }[]
  /** Time between consecutive correct clicks (from 2 on), over all rounds. */
  tileMs: number[]
  /** The round of every wrong tile (each cost a life). */
  misses: number[]
}

interface Props {
  /** Lives for the whole run: a wrong tile costs one, and the same round is played again with a new layout. */
  lives: number
  tilesFor: (round: number) => number
  memorizeMsFor: (round: number) => number
  /** Builds the result from the number of cleared rounds when the last life is lost. */
  result: (clearedRounds: number, stats: OrderRunStats) => TestResult
  roundLabel: (round: number) => string
  /** Small text next to the round on the left: "6 tiles", "810 ms flash". */
  roundUnit: (round: number, tiles: number) => string
  /** The score so far (after this many cleared rounds), shown on the right like in the other tests. */
  scoreSoFar: (clearedRounds: number) => { value: string; unit?: string }
  onFinish: (r: TestResult) => void
}

/**
 * Shared game for Number Order and Flash Order: numbers 1..N appear on a grid,
 * hide after a timer (or when you tap "1"), then you tap them in order. A mistake costs a life.
 */
export function OrderGame({ lives: startLives, tilesFor, memorizeMsFor, result, roundLabel, roundUnit, scoreSoFar, onFinish }: Props) {
  const [round, setRound] = useState(0)
  const [cells, setCells] = useState(() => placeTiles(tilesFor(0)))
  const [phase, setPhase] = useState<Phase>('show')
  const [next, setNext] = useState(0) // index of the number to tap next
  const [wrongCell, setWrongCell] = useState<number | null>(null)
  const [lives, setLives] = useState(startLives)
  const memorizeMs = memorizeMsFor(round)
  const showAt = useRef(0)
  const lastTapAt = useRef(0)
  const stats = useRef<OrderRunStats>({ memorizeUsed: [], tileMs: [], misses: [] })
  const endMemorize = () => stats.current.memorizeUsed.push({ round, ms: performance.now() - showAt.current })

  useEffect(() => {
    let t: number | undefined
    if (phase === 'show') showAt.current = performance.now()
    /** Play this round (new layout). */
    const play = (r: number) => {
      setRound(r)
      setCells(placeTiles(tilesFor(r)))
      setNext(0)
      setWrongCell(null)
      setPhase('show')
    }
    if (phase === 'success') t = window.setTimeout(() => play(round + 1), 700)
    if (phase === 'fail')
      t = window.setTimeout(() => (lives > 0 ? play(round) : onFinish(result(round, stats.current))), END_MOMENT_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Memorize time, shown as the timer line; clicking 1 early ends it.
  const showLeft = useCountdown(memorizeMs, phase === 'show', () => {
    endMemorize()
    setPhase('hidden')
  })

  const tap = (cell: number) => {
    if (phase !== 'show' && phase !== 'hidden') return
    const index = cells.indexOf(cell)
    if (index === -1) return // empty cell: ignore
    if (phase === 'show' && index !== 0) return // while visible, only "1" starts the answer
    if (index !== next) {
      stats.current.misses.push(round)
      setWrongCell(cell)
      setLives(lives - 1)
      return setPhase('fail')
    }
    const now = performance.now()
    if (index > 0) stats.current.tileMs.push(now - lastTapAt.current)
    lastTapAt.current = now
    if (phase === 'show') {
      endMemorize()
      setPhase('hidden')
    }
    if (next + 1 === cells.length) setPhase('success')
    setNext(next + 1)
  }

  const middle =
    phase === 'show' ? 'Memorize · click 1 when ready'
    : phase === 'hidden' ? `Click ${next + 1} next`
    : phase === 'success' ? 'Correct'
    : lives > 0 ? 'Wrong tile · try this round again'
    : 'Out of lives'

  return (
    <>
      <GameInfo
        left={<><InfoValue value={roundLabel(round)} unit={roundUnit(round, cells.length)} /><Lives left={lives} total={startLives} /></>}
        middle={<span className={phase === 'fail' ? 'text-rose-300' : ''}>{middle}</span>}
        right={<InfoValue label="Score" {...scoreSoFar(round)} />}
        timer={phase === 'show' ? showLeft / memorizeMs : undefined}
      />
      <SquareLayout aspect={COLS / ROWS}>
        <TileGrid
          key={`${round}-${lives}`}
          cols={COLS}
          rows={ROWS}
          gap="gap-1.5"
          frame={phase === 'success' ? 'success' : phase === 'fail' ? 'fail' : null}
          onTap={phase === 'show' || phase === 'hidden' ? tap : undefined}
          tile={(cell) => {
            const index = cells.indexOf(cell)
            if (index === -1) return { tone: 'empty' }
            const reveal = phase === 'show' || phase === 'fail'
            if (cell === wrongCell) return { tone: 'wrong', content: index + 1 }
            if (index < next) return { tone: 'done', content: index + 1 }
            if (reveal) return { tone: 'revealed', content: index + 1, label: String(index + 1) }
            return { tone: 'hidden', label: 'Hidden tile' }
          }}
        />
      </SquareLayout>
    </>
  )
}
