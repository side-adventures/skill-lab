import { useEffect, useState } from 'react'
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
    else if (phase === 'show') t = window.setTimeout(() => setPhase('input'), SHOW_MS)
    else if (phase === 'cleared') t = window.setTimeout(() => startLevel(level + 1), 600)
    else if (phase === 'failed')
      t = window.setTimeout(() => {
        if (lives > 0) return startLevel(level)
        onFinish({
          score: cleared,
          details: { 'Levels cleared': String(cleared), 'Last level tiles': String(targets.size) },
        })
      }, 1400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
  const message: Record<Phase, string> = {
    pause: 'Watch closely…',
    show: 'Remember these tiles',
    input: `Tap the ${targets.size} tiles (${targets.size - found.size} left)`,
    cleared: 'Level cleared!',
    failed: lives > 0 ? 'Missed — try this level again' : 'Game over',
  }

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Level {level}</span>
        <span aria-label={`${lives} lives left`}>
          {'♥'.repeat(lives)}
          <span className="opacity-30">{'♥'.repeat(LIVES - lives)}</span>
        </span>
      </div>
      <p className="mb-3 text-center font-medium" role="status">{message[phase]}</p>
      <div
        className="play-area mx-auto grid aspect-square w-full max-w-[min(480px,60vh)] gap-1.5 rounded-2xl bg-zinc-200 p-2 sm:gap-2 dark:bg-zinc-800"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, i) => {
          const isTarget = targets.has(i)
          let cls = 'bg-white dark:bg-zinc-700'
          if (phase === 'show' && isTarget) cls = 'bg-violet-500'
          else if (found.has(i)) cls = 'bg-violet-500'
          else if (wrong.has(i)) cls = 'bg-rose-500/70'
          else if (phase === 'failed' && isTarget) cls = 'bg-violet-500/40 ring-2 ring-violet-500 ring-inset'
          return (
            <button
              key={`${level}-${i}`}
              type="button"
              aria-label={`Tile ${i + 1}`}
              onPointerDown={() => tap(i)}
              className={`rounded-lg transition-colors duration-150 ${cls} ${phase === 'input' ? 'cursor-pointer' : 'cursor-default'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
