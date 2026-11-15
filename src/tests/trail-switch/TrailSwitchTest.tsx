import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import type { TestComponentProps } from '../types'
import { LABELS_A, LABELS_B, PENALTY_MS, RADIUS, makeLayout, partTime, type PartResult } from './scoring'

const PARTS = [
  { labels: LABELS_A, name: 'Numbers', task: 'Click 1 → 2 → 3 … in order' },
  { labels: LABELS_B, name: 'Numbers and letters', task: 'Alternate: 1 → A → 2 → B → 3 …' },
]

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`

export default function TrailSwitchTest({ onFinish }: TestComponentProps) {
  const [part, setPart] = useState(0)
  const [layout, setLayout] = useState(makeLayout)
  const [next, setNext] = useState(0) // index of the circle to click now
  const [wrong, setWrong] = useState(0)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const [between, setBetween] = useState(false)
  const [now, setNow] = useState(0)
  const startedAt = useRef(0)
  const [partA, setPartA] = useState<PartResult | null>(null)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // A running clock for the info row while a part is played.
  useEffect(() => {
    if (between) return
    startedAt.current = performance.now()
    const id = window.setInterval(() => setNow(performance.now() - startedAt.current), 100)
    return () => window.clearInterval(id)
  }, [between, part])

  const { labels } = PARTS[part]

  const click = (i: number) => {
    if (between || i < next) return // already done
    if (i !== next) {
      setWrong(wrong + 1)
      setWrongAt(i)
      signal(false)
      later(350, () => setWrongAt((w) => (w === i ? null : w)))
      return
    }
    if (next + 1 < labels.length) return setNext(next + 1)
    // Part finished.
    const res = { ms: performance.now() - startedAt.current, wrong }
    signal(true)
    setNext(next + 1)
    if (part + 1 < PARTS.length) {
      setPartA(res)
      return setBetween(true)
    }
    const a = partA!
    const b = res
    const ta = partTime(a)
    const tb = partTime(b)
    onFinish({
      score: Math.round(tb),
      details: {
        stats: [
          { label: 'Wrong clicks', value: `${a.wrong + b.wrong}` },
          { label: 'Penalty', value: `+${(a.wrong + b.wrong) * (PENALTY_MS / 1000)} s` },
        ],
        extra: {
          kind: 'pair',
          a: { label: 'Numbers only', value: secs(ta) },
          b: { label: 'Switching', value: secs(tb) },
          diff: { label: 'Switching cost', value: tb >= ta ? `${secs(tb - ta)} slower` : `${secs(ta - tb)} faster` },
        },
      },
    })
  }

  const startPartB = () => {
    setPart(1)
    setLayout(makeLayout())
    setNext(0)
    setWrong(0)
    setNow(0)
    setBetween(false)
  }

  const shownTime = now + wrong * PENALTY_MS
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Part ${part + 1}`} of={PARTS.length} />}
        middle={between ? '' : PARTS[part].task}
        right={!between && <InfoValue value={(shownTime / 1000).toFixed(1)} unit="s" />}
      />
      <SquareLayout>
        <div className={`play-area relative size-full rounded-2xl bg-zinc-900 ${feedbackRing(flash)}`}>
          {between && partA ? (
            <div className="grid size-full place-items-center">
              <RoundResult
                value={(partTime(partA) / 1000).toFixed(1)}
                unit="s"
                line={<>Part 1 done · next: <span className="text-zinc-200">1 → A → 2 → B → 3 …</span></>}
                onContinue={startPartB}
              />
            </div>
          ) : (
            <>
              <svg viewBox="0 0 1 1" className="pointer-events-none absolute inset-0 size-full">
                {layout.slice(1, next).map((p, i) => (
                  <line key={i} x1={layout[i].x} y1={layout[i].y} x2={p.x} y2={p.y} stroke="#8b5cf6" strokeOpacity={0.6} strokeWidth={0.006} strokeLinecap="round" />
                ))}
              </svg>
              {layout.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onPointerDown={(e) => e.button === 0 && click(i)}
                  className={`absolute grid -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-2 text-lg font-bold ${
                    i === wrongAt ? 'border-rose-400 bg-rose-700 text-white'
                    : i < next ? 'border-violet-500/60 bg-violet-500/25 text-violet-200'
                    : 'border-zinc-500 bg-zinc-800 text-zinc-100 hover:border-zinc-300'
                  }`}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${RADIUS * 200}%`, height: `${RADIUS * 200}%` }}
                >
                  {labels[i]}
                </button>
              ))}
            </>
          )}
        </div>
      </SquareLayout>
    </>
  )
}
