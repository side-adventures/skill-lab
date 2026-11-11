import { useEffect, useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { TileGrid } from '../../components/game/TileGrid'
import { END_MOMENT_MS } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { LIVES, MISSES_PER_LEVEL, SHOW_MS, gridSize, pickTiles } from './scoring'

type Phase = 'pause' | 'show' | 'input' | 'cleared' | 'failed'

export default function VisualMemoryTest({ onFinish }: TestComponentProps) {
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(LIVES)
  const [cleared, setCleared] = useState(0)
  const [targets, setTargets] = useState(() => new Set(pickTiles(1)))
  const [found, setFound] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<Set<number>>(new Set())
  const [phase, setPhase] = useState<Phase>('pause')

  const startLevel = (lvl: number) => {
    setLevel(lvl)
    setTargets(new Set(pickTiles(lvl)))
    setFound(new Set())
    setWrong(new Set())
    setPhase('pause')
  }

  useEffect(() => {
    let t: number | undefined
    if (phase === 'pause') t = window.setTimeout(() => setPhase('show'), 600)
    else if (phase === 'cleared') t = window.setTimeout(() => startLevel(level + 1), 600)
    else if (phase === 'failed')
      t = window.setTimeout(() => {
        if (lives > 0) return startLevel(level)
        onFinish({
          score: cleared,
          details: { 'Levels cleared': String(cleared), 'Last level tiles': String(targets.size) },
        })
      }, END_MOMENT_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Memorize time, shown as the timer line.
  const showLeft = useCountdown(SHOW_MS, phase === 'show', () => setPhase('input'))

  const tap = (cell: number) => {
    if (phase !== 'input' || found.has(cell) || wrong.has(cell)) return
    if (targets.has(cell)) {
      const next = new Set(found).add(cell)
      setFound(next)
      if (next.size === targets.size) {
        setCleared(level)
        setPhase('cleared')
      }
    } else {
      const next = new Set(wrong).add(cell)
      setWrong(next)
      if (next.size >= MISSES_PER_LEVEL) {
        setLives((l) => l - 1)
        setPhase('failed')
      }
    }
  }

  const size = gridSize(level)
  const middle: Record<Phase, string> = {
    pause: 'Watch',
    show: 'Memorize',
    input: `Your turn · ${targets.size - found.size} left`,
    cleared: 'Level cleared',
    failed: lives > 0 ? 'Missed · try again' : 'Game over',
  }

  return (
    <>
      <GameInfo
        left={<><InfoValue value={`Level ${level}`} /><Lives left={lives} total={LIVES} /></>}
        middle={middle[phase]}
        right={<InfoValue label="Score" value={cleared} />}
        timer={phase === 'show' ? showLeft / SHOW_MS : undefined}
      />
      <SquareLayout>
        <TileGrid
          key={level}
          cols={size}
          gap="gap-1.5"
          frame={phase === 'cleared' ? 'success' : phase === 'failed' ? 'fail' : null}
          onTap={phase === 'input' ? tap : undefined}
          tile={(i) => {
            const isTarget = targets.has(i)
            if (phase === 'show' && isTarget) return { tone: 'lit' }
            if (found.has(i)) return { tone: 'found' }
            if (wrong.has(i)) return { tone: 'wrong' }
            if (phase === 'failed' && isTarget) return { tone: 'hint' }
            return { tone: 'idle' }
          }}
        />
      </SquareLayout>
    </>
  )
}
