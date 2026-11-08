import { useEffect, useRef, useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown, useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { COLORS, DURATION_MS, nextTrial, stroopScore } from './scoring'

export default function StroopTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [trial, setTrial] = useState(() => nextTrial(undefined))
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const remaining = useCountdown(DURATION_MS, started, () =>
    onFinish({
      score: stroopScore(correct, wrong),
      details: {
        Correct: String(correct),
        Wrong: String(wrong),
        'Per minute': String(Math.round((correct / DURATION_MS) * 60_000)),
      },
    }),
  )

  const answer = (color: number) => {
    if (!started || remaining <= 0) return
    const ok = color === trial.ink
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    setFlash(ok ? 'ok' : 'bad')
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 200)
    setTrial((t) => nextTrial(t))
  }

  // Keys 1–4 map to the buttons.
  const answerRef = useLatest(answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      if (i >= 0 && i < COLORS.length && !e.repeat) answerRef.current(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerRef])

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const ring = flash === 'ok' ? 'ring-emerald-500' : flash === 'bad' ? 'ring-rose-500' : 'ring-transparent'
  return (
    <div>
      <TimerBar remaining={remaining} total={DURATION_MS}>
        ✓ {correct} · ✗ {wrong}
      </TimerBar>
      {/* Always-dark panel so all four ink colors stay readable in light mode too */}
      <div className={`grid h-48 place-items-center rounded-2xl bg-zinc-900 ring-4 transition-shadow sm:h-56 ${ring}`}>
        <span className="text-5xl font-black tracking-wider sm:text-6xl" style={{ color: COLORS[trial.ink].hex }}>
          {COLORS[trial.word].label}
        </span>
      </div>
      <p className="my-3 text-center text-sm text-zinc-500">Tap the color of the ink</p>
      <div className="play-area grid grid-cols-2 gap-3">
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onPointerDown={() => answer(i)}
            className="flex h-16 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-lg font-semibold active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className="size-4 rounded-full" style={{ background: c.hex }} aria-hidden />
            {c.name[0].toUpperCase() + c.name.slice(1)}
            <kbd className="ml-1 hidden text-xs text-zinc-400 sm:inline">{i + 1}</kbd>
          </button>
        ))}
      </div>
    </div>
  )
}
