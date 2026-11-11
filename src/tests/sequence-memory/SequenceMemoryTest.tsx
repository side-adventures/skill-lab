import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { TileGrid } from '../../components/game/TileGrid'
import { END_MOMENT_MS } from '../../lib/game'
import type { TestComponentProps } from '../types'
import { GRID, STEP_GAP_MS, STEP_ON_MS, extend } from './scoring'

type Phase = 'pause' | 'show' | 'input' | 'success' | 'fail'

export default function SequenceMemoryTest({ onFinish }: TestComponentProps) {
  const [seq, setSeq] = useState<number[]>(() => extend([]))
  const [phase, setPhase] = useState<Phase>('pause')
  const [lit, setLit] = useState<number | null>(null)
  const [pos, setPos] = useState(0)
  const [wrongTile, setWrongTile] = useState<number | null>(null)
  const tapTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(tapTimer.current), [])

  // Drive the phases: short pause, play back the sequence, then wait for input.
  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    if (phase === 'pause') at(700, () => setPhase('show'))
    if (phase === 'show') {
      seq.forEach((tile, i) => {
        at(i * (STEP_ON_MS + STEP_GAP_MS), () => setLit(tile))
        at(i * (STEP_ON_MS + STEP_GAP_MS) + STEP_ON_MS, () => setLit(null))
      })
      at(seq.length * (STEP_ON_MS + STEP_GAP_MS), () => {
        setPos(0)
        setPhase('input')
      })
    }
    if (phase === 'success')
      at(600, () => {
        setSeq((s) => extend(s))
        setPhase('pause')
      })
    if (phase === 'fail')
      at(END_MOMENT_MS, () =>
        onFinish({ score: seq.length - 1, details: { 'Failed at length': String(seq.length) } }),
      )
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const tap = (tile: number) => {
    if (phase !== 'input') return
    setLit(tile)
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => setLit(null), 150)
    if (tile !== seq[pos]) {
      setWrongTile(tile)
      return setPhase('fail') // the board then shows which tile it should have been
    }
    if (pos + 1 === seq.length) setPhase('success')
    else setPos(pos + 1)
  }

  const middle: Record<Phase, string> = {
    pause: 'Watch',
    show: 'Watch',
    input: `Repeat · ${pos} / ${seq.length}`,
    success: 'Correct',
    fail: 'Wrong tile',
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={`Length ${seq.length}`} />}
        middle={<span className={phase === 'fail' ? 'text-rose-300' : ''}>{middle[phase]}</span>}
        right={<InfoValue label="Score" value={seq.length - 1} />}
      />
      <SquareLayout>
        <TileGrid
          cols={GRID}
          frame={phase === 'success' ? 'success' : phase === 'fail' ? 'fail' : null}
          onTap={phase === 'input' ? tap : undefined}
          tile={(i) => {
            if (i === wrongTile && phase === 'fail') return { tone: 'wrong' }
            if (phase === 'fail' && i === seq[pos]) return { tone: 'hint' }
            if (i === lit) return { tone: 'lit' }
            return { tone: 'idle' }
          }}
        />
      </SquareLayout>
    </>
  )
}
