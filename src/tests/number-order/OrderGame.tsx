import { useEffect, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { TileGrid } from '../../components/game/TileGrid'
import { END_MOMENT_MS } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
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
    if (phase === 'success')
      t = window.setTimeout(() => {
        setRound(round + 1)
        setCells(placeTiles(tilesFor(round + 1)))
        setNext(0)
        setPhase('show')
      }, 700)
    if (phase === 'fail') t = window.setTimeout(() => onFinish(result(round)), END_MOMENT_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Memorize time, shown as the timer line; clicking 1 early ends it.
  const showLeft = useCountdown(memorizeMs, phase === 'show', () => setPhase('hidden'))

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

  const middle =
    phase === 'show' ? 'Memorize · click 1 when ready'
    : phase === 'hidden' ? `Click ${next + 1} next`
    : phase === 'success' ? 'Correct'
    : 'Wrong tile'

  return (
    <>
      <GameInfo
        left={<InfoValue value={roundLabel(round)} unit={`${cells.length} tiles`} />}
        middle={<span className={phase === 'fail' ? 'text-rose-300' : ''}>{middle}</span>}
        right={<InfoValue label="Time" value={(memorizeMs / 1000).toFixed(memorizeMs < 1000 ? 2 : 1)} unit="s" />}
        timer={phase === 'show' ? showLeft / memorizeMs : undefined}
      />
      <SquareLayout aspect={COLS / ROWS}>
        <TileGrid
          key={round}
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
