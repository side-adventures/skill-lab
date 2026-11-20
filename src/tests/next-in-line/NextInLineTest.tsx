import { useEffect, useId, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useCountdown, useLatest } from '../../lib/hooks'
import { answerStats } from '../../lib/resultFormat'
import { correctMinusWrong } from '../../lib/scoring'
import type { TestComponentProps } from '../types'
import { DURATION_MS, levelOf, makeSeries, type Fig } from './scoring'

/** How long a wrong answer shows the right option before the next series (the clock keeps running). */
const SHOW_RIGHT_MS = 700
const KEYS = ['1', '2', '3', '4']

/** Corner squares, clockwise from the top left. */
const CORNERS: [number, number][] = [[4, 4], [86, 4], [86, 86], [4, 86]]

/** Triangle, square, circle, centred on (50, 43) and about the same size. */
const SHAPES = ['M50 11L83 66H17Z', 'M23 16H77V70H23Z', 'M21 43a29 29 0 1 0 58 0a29 29 0 1 0 -58 0Z']

export function Figure({ fig }: { fig: Fig }) {
  const id = useId()
  const cx = 50, cy = 43
  const a = (fig.hand * Math.PI) / 4
  const dotGap = 9
  const dotX0 = 50 - ((fig.dots - 1) * dotGap) / 2
  const [mx, my] = CORNERS[fig.marker]
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <defs>
        <pattern id={`${id}-s`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2.4" height="6" className="fill-zinc-300" />
        </pattern>
      </defs>
      <rect x={mx} y={my} width="10" height="10" rx="1.5" className="fill-amber-300" />
      <path
        d={SHAPES[fig.shape]}
        className={`stroke-zinc-200 ${fig.fill === 2 ? 'fill-zinc-400' : ''}`}
        fill={fig.fill === 0 ? 'none' : fig.fill === 1 ? `url(#${id}-s)` : undefined}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1={cx} y1={cy} x2={cx + 21 * Math.sin(a)} y2={cy - 21 * Math.cos(a)} className="stroke-violet-400" strokeWidth="5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" className="fill-violet-400" />
      {Array.from({ length: fig.dots }, (_, i) => (
        <circle key={i} cx={dotX0 + i * dotGap} cy="88" r="3.2" className="fill-zinc-200" />
      ))}
    </svg>
  )
}

interface Answer { ms: number; correct: boolean; level: number; rules: number }

export default function NextInLineTest({ onFinish }: TestComponentProps) {
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [series, setSeries] = useState(() => makeSeries(1))
  // After a wrong answer: the picked option (red) and the right one (green) show for a moment.
  const [reveal, setReveal] = useState<number | null>(null)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [series])
  const answers = useRef<Answer[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const all = answers.current
    const byRules = [1, 2, 3, 4].map((n) => all.filter((a) => a.rules === n)).filter((xs) => xs.length)
    onFinish({
      score: correctMinusWrong(correct, wrong),
      ...(all.length === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: [...answerStats(all), { label: 'Highest level', value: String(Math.max(1, ...all.map((a) => a.level))) }],
        extra: {
          kind: 'table',
          columns: ['Changes', 'Correct', 'Wrong'],
          rows: byRules.map((xs) => ({
            cells: [String(xs[0].rules), String(xs.filter((a) => a.correct).length), String(xs.filter((a) => !a.correct).length)],
          })),
        },
      },
    })
  })
  const over = remaining <= 0

  const answer = (i: number) => {
    if (over || reveal !== null) return
    const ok = i === series.answer
    answers.current.push({ ms: performance.now() - shownAt.current, correct: ok, level: series.level, rules: series.rules.length })
    signal(ok)
    const nextCorrect = correct + (ok ? 1 : 0)
    if (ok) {
      setCorrect(nextCorrect)
      setSeries(makeSeries(levelOf(nextCorrect)))
      return
    }
    setWrong((w) => w + 1)
    setReveal(i)
    later(SHOW_RIGHT_MS, () => {
      setReveal(null)
      setSeries(makeSeries(levelOf(nextCorrect)))
    })
  }
  const answerRef = useLatest(answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const i = KEYS.indexOf(e.key)
      if (i < 0) return
      e.preventDefault()
      answerRef.current(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerRef])

  const level = levelOf(correct)
  return (
    <>
      <GameInfo
        left={<><InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" /><InfoValue label="Level" value={level} /></>}
        middle="What comes next?"
        right={<InfoValue label="Score" value={correctMinusWrong(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="flex w-full items-center justify-center gap-3 px-6">
            {series.figs.slice(0, -1).map((f, i) => (
              <div key={i} className="aspect-square w-[128px] rounded-lg border border-zinc-800 bg-zinc-900 p-1.5">
                <Figure fig={f} />
              </div>
            ))}
            <span className="px-1 text-2xl text-zinc-600">→</span>
            <div className="grid aspect-square w-[128px] place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-4xl font-bold text-zinc-600">
              ?
            </div>
          </div>
        }
        answers={
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-4">
            {series.options.map((f, i) => {
              const state = reveal === null ? '' : i === series.answer ? 'border-emerald-400 ring-2 ring-emerald-400/60' : i === reveal ? 'border-rose-400 ring-2 ring-rose-400/65' : 'opacity-40'
              return (
                <button
                  key={i}
                  type="button"
                  disabled={over}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    e.preventDefault()
                    answer(i)
                  }}
                  className={`flex flex-col items-center rounded-xl border border-zinc-700 bg-zinc-900 px-2 pt-2 pb-1.5 transition-colors hover:border-zinc-500 ${state}`}
                >
                  <div className="aspect-square w-full"><Figure fig={f} /></div>
                  <kbd className="mt-1 rounded-md border border-zinc-700 px-1.5 text-xs font-medium text-zinc-500">{KEYS[i]}</kbd>
                </button>
              )
            })}
          </div>
        }
      />
    </>
  )
}
