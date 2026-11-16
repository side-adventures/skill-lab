import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { fmtMs } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { GRID, ITEM, PAUSE_MS, PENALTY_MS, bySize, makeRounds, roundTime, searchScore, type RoundResult } from './scoring'

// Two equal bars: T = the bar meets the middle, L = it meets the end.
const T_PATH = 'M4 5h16M12 5v15'
const L_PATH = 'M5 4v16h15'

export default function OddOneOutTest({ onFinish }: TestComponentProps) {
  const [rounds] = useState(makeRounds)
  const [r, setR] = useState(0)
  const [showing, setShowing] = useState(false)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const wrong = useRef(0)
  const shownAt = useRef(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // A short "+" before every round, then the shapes.
  useEffect(() => {
    later(PAUSE_MS, () => {
      wrong.current = 0
      setWrongAt(null)
      setShowing(true)
      requestAnimationFrame(() => (shownAt.current = performance.now()))
    })
  }, [r, later])

  const round = rounds[r]

  const click = (i: number) => {
    if (!showing || !shownAt.current) return
    if (!round.items[i].target) {
      wrong.current++
      setWrongAt(i)
      signal(false)
      return
    }
    const res = [...results, { size: round.size, ms: performance.now() - shownAt.current, wrong: wrong.current }]
    setResults(res)
    shownAt.current = 0
    signal(true)
    if (r + 1 < rounds.length) {
      setShowing(false)
      setWrongAt(null)
      return setR(r + 1)
    }
    const { rows, perItem } = bySize(res)
    const totalWrong = res.reduce((s, x) => s + x.wrong, 0)
    onFinish({
      score: searchScore(res),
      details: {
        stats: [
          { label: 'Each extra shape', value: perItem === undefined ? '–' : `${perItem >= 0 ? '+' : '−'}${Math.abs(Math.round(perItem))} ms` },
          { label: 'Fastest round', value: fmtMs(Math.min(...res.map(roundTime))) },
          { label: 'Wrong clicks', value: String(totalWrong) },
        ],
        extra: {
          kind: 'table',
          columns: ['Shapes', 'Median', 'Wrong'],
          rows: rows.map((x) => ({ cells: [String(x.size), x.median === undefined ? '–' : fmtMs(x.median), String(x.wrong)] })),
        },
      },
    })
  }

  const size = `${(ITEM / GRID) * 100}%`
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${r + 1}`} of={rounds.length} />}
        middle={<>Click the <b className="text-zinc-200">T</b> among the L shapes{wrongAt !== null && <span className="text-rose-300"> · +{PENALTY_MS / 1000} s</span>}</>}
        right={results.length > 0 && <InfoValue label="Total" value={(searchScore(results) / 1000).toFixed(1)} unit="s" />}
      />
      <SquareLayout>
        <div className={`play-area relative size-full rounded-2xl bg-zinc-900 ${feedbackRing(flash)}`}>
          {!showing ? (
            <div className="grid size-full place-items-center text-5xl text-zinc-600">+</div>
          ) : (
            round.items.map((it, i) => (
              <button
                key={`${r}-${i}`}
                type="button"
                aria-label={it.target ? 'T' : 'L'}
                onPointerDown={(e) => e.button === 0 && click(i)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: size, height: size }}
              >
                <svg viewBox="0 0 24 24" className={`size-full ${i === wrongAt ? 'text-rose-400' : 'text-zinc-200'}`} style={{ transform: `rotate(${it.rot}deg)` }}>
                  <path d={it.target ? T_PATH : L_PATH} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))
          )}
        </div>
      </SquareLayout>
    </>
  )
}
