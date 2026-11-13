import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { TileGrid } from '../../components/game/TileGrid'
import { END_MOMENT_MS } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { fmtMs } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { LIVES, SHOW_MS, gridSize, pickTiles, tileCount } from './scoring'

type Phase = 'pause' | 'show' | 'input' | 'cleared' | 'failed'

export default function VisualMemoryTest({ onFinish }: TestComponentProps) {
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(LIVES)
  const [cleared, setCleared] = useState(0)
  const [targets, setTargets] = useState(() => new Set(pickTiles(1)))
  const [found, setFound] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('pause')
  // For the result stats: when the current input phase began, time to clear each level.
  const inputAt = useRef(0)
  const levelTimes = useRef<{ level: number; ms: number }[]>([])

  const startLevel = (lvl: number) => {
    setLevel(lvl)
    setTargets(new Set(pickTiles(lvl)))
    setFound(new Set())
    setWrong(null)
    setPhase('pause')
  }

  useEffect(() => {
    let t: number | undefined
    if (phase === 'pause') t = window.setTimeout(() => setPhase('show'), 600)
    else if (phase === 'cleared') t = window.setTimeout(() => startLevel(level + 1), 600)
    else if (phase === 'failed')
      t = window.setTimeout(() => {
        if (lives > 0) return startLevel(level)
        const times = levelTimes.current
        const size = gridSize(level)
        onFinish({
          score: cleared,
          details: {
            stats: [
              { label: 'Most tiles', value: String(cleared ? tileCount(cleared) : 0) },
              { label: 'Last grid', value: `${size}×${size}` },
              ...(times.length ? [{ label: 'Avg per level', value: fmtMs(times.reduce((s, t) => s + t.ms, 0) / times.length) }] : []),
            ],
            chips: { title: 'Time to clear', items: times.map((t) => ({ label: `Level ${t.level}`, value: fmtMs(t.ms) })) },
          },
        })
      }, END_MOMENT_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Memorize time, shown as the timer line.
  const showLeft = useCountdown(SHOW_MS, phase === 'show', () => {
    inputAt.current = performance.now()
    setPhase('input')
  })

  const tap = (cell: number) => {
    if (phase !== 'input' || found.has(cell)) return
    if (targets.has(cell)) {
      const next = new Set(found).add(cell)
      setFound(next)
      if (next.size === targets.size) {
        setCleared(level)
        levelTimes.current.push({ level, ms: performance.now() - inputAt.current })
        setPhase('cleared')
      }
    } else {
      // One wrong click fails the level: the board then shows the tiles you missed.
      setWrong(cell)
      setLives((l) => l - 1)
      setPhase('failed')
    }
  }

  const size = gridSize(level)
  const middle: Record<Phase, ReactNode> = {
    pause: 'Watch',
    show: 'Memorize',
    input: `Your turn · ${targets.size - found.size} left`,
    cleared: 'Level cleared',
    failed: lives > 0 ? 'Wrong tile · new pattern' : <span className="text-rose-300">Out of lives</span>,
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
            if (wrong === i) return { tone: 'wrong' }
            if (phase === 'failed' && isTarget) return { tone: 'hint' }
            return { tone: 'idle' }
          }}
        />
      </SquareLayout>
    </>
  )
}
