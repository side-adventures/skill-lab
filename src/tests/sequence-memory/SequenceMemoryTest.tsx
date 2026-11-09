import { useEffect, useRef, useState } from 'react'
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
      at(1500, () =>
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
      setLit(seq[pos]) // show which one it should have been
      return setPhase('fail')
    }
    if (pos + 1 === seq.length) setPhase('success')
    else setPos(pos + 1)
  }

  const message: Record<Phase, string> = {
    pause: 'Watch…',
    show: 'Watch the sequence',
    input: `Repeat it (${pos} / ${seq.length})`,
    success: 'Correct!',
    fail: 'Wrong tile',
  }

  return (
    <div>
      <div className="mb-3 text-sm text-zinc-500">Length {seq.length}</div>
      <p className="mb-3 text-center font-medium" role="status">{message[phase]}</p>
      <div
        className="play-area mx-auto grid aspect-square w-full max-w-[min(420px,55vh)] gap-2 rounded-2xl bg-zinc-200 p-2 dark:bg-zinc-800"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID * GRID }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Tile ${i + 1}`}
            onPointerDown={() => tap(i)}
            // Whole board lights up bright green on a correct sequence; on a mistake the wrong tile
            // turns red and the right one is shown.
            className={`rounded-xl transition-colors duration-150 ${
              wrongTile === i ? 'bg-rose-500'
              : phase === 'success' ? 'bg-emerald-400'
              : lit === i ? 'bg-violet-500'
              : 'bg-white dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
