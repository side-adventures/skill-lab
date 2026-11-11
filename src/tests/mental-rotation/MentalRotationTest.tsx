import { useEffect, useRef, useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown, useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, makeTrial, mirror, type Shape } from './scoring'

function ShapeView({ shape, angle }: { shape: Shape; angle: number }) {
  // Rotate around the center of the bounding box (works for any offset), which keeps every
  // allowed shape (max 4 × 4 cells, half-diagonal 2.83) inside the 6 × 6 view.
  const xs = shape.map((c) => c[0]), ys = shape.map((c) => c[1])
  const cx = (Math.min(...xs) + Math.max(...xs) + 1) / 2
  const cy = (Math.min(...ys) + Math.max(...ys) + 1) / 2
  return (
    <svg viewBox="-3 -3 6 6" className="mx-auto aspect-square h-full max-w-full">
      <g transform={`rotate(${angle}) translate(${-cx} ${-cy})`}>
        {shape.map(([x, y]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} className="fill-violet-500 stroke-white dark:stroke-zinc-900" strokeWidth={0.08} />
        ))}
      </g>
    </svg>
  )
}

export default function MentalRotationTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [trial, setTrial] = useState(makeTrial)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const remaining = useCountdown(DURATION_MS, started, () =>
    onFinish({
      score: correct - wrong,
      details: {
        Correct: String(correct),
        Wrong: String(wrong),
        'Avg per answer': correct + wrong ? `${(DURATION_MS / 1000 / (correct + wrong)).toFixed(1)} s` : '–',
      },
    }),
  )

  const answer = (saysMirrored: boolean) => {
    if (!started || remaining <= 0) return
    const ok = saysMirrored === trial.mirrored
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    setFlash(ok ? 'ok' : 'bad')
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 250)
    setTrial(makeTrial())
  }

  const answerRef = useLatest(answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key.toLowerCase() === 's') answerRef.current(false)
      if (e.key.toLowerCase() === 'm') answerRef.current(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerRef])

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const ring = flash === 'ok' ? 'ring-emerald-500' : flash === 'bad' ? 'ring-rose-500' : 'ring-transparent'
  return (
    <div className="flex h-full flex-col">
      <TimerBar remaining={remaining} total={DURATION_MS}>✓ {correct} · ✗ {wrong}</TimerBar>
      <div className={`grid min-h-0 flex-1 grid-cols-2 gap-6 rounded-2xl bg-white p-4 ring-4 transition-shadow dark:bg-zinc-900 ${ring}`}>
        <ShapeView shape={trial.shape} angle={trial.leftAngle} />
        <ShapeView shape={trial.mirrored ? mirror(trial.shape) : trial.shape} angle={trial.rightAngle} />
      </div>
      <p className="my-3 text-center text-sm text-zinc-500">Is the right shape the left one rotated — or its mirror image?</p>
      <div className="play-area grid grid-cols-2 gap-3">
        <button type="button" onPointerDown={() => answer(false)} className="h-16 rounded-xl bg-violet-600 text-lg font-bold tracking-wider text-white active:bg-violet-700">
          SAME <kbd className="ml-1 hidden text-xs opacity-60 sm:inline">S</kbd>
        </button>
        <button type="button" onPointerDown={() => answer(true)} className="h-16 rounded-xl bg-zinc-200 text-lg font-bold tracking-wider active:bg-zinc-300 dark:bg-zinc-800 dark:active:bg-zinc-700">
          MIRRORED <kbd className="ml-1 hidden text-xs opacity-60 sm:inline">M</kbd>
        </button>
      </div>
    </div>
  )
}
