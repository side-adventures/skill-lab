import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useContinue } from '../../lib/game'
import { useLatest } from '../../lib/hooks'
import { fmtMs } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { DURATION_MS, PENALTY_MS, levelOf, makePuzzle, penaltyMs, type Cell, type Rule } from './scoring'

/** Answers in the first moment after a new puzzle shows are ignored, so a double click can't answer it unseen. */
const INPUT_LOCK_MS = 400

/** Where the copies go for 1–6 of them (in a 100 × 100 box), and how much smaller they get. */
const SPOTS: [number, number][][] = [
  [[50, 50]],
  [[26, 50], [74, 50]],
  [[50, 28], [27, 71], [73, 71]],
  [[29, 29], [71, 29], [29, 71], [71, 71]],
  [[23, 23], [77, 23], [50, 50], [23, 77], [77, 77]],
  [[21, 32], [50, 32], [79, 32], [21, 68], [50, 68], [79, 68]],
]
const SCALE = [1.55, 0.85, 0.85, 0.8, 0.6, 0.56]
const RADIUS = 14
/** The figures stay inside the ring of dots. */
const INNER = 0.72
/** The 8 dot spots: corners and side middles, clockwise from the top left. */
const EDGE: [number, number][] = [[8, 8], [50, 8], [92, 8], [92, 50], [92, 92], [50, 92], [8, 92], [8, 50]]
const FILL = ['fill-zinc-950', 'fill-zinc-500', 'fill-zinc-100']

/** Triangle, square, hexagon, circle, star: different at a glance even when small. */
function shapePath(shape: number, cx: number, cy: number, r: number) {
  if (shape === 3) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`
  const poly = (n: number, rot: number, rr: (i: number) => number, dy = 0) =>
    'M' + Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + rot + (i * 2 * Math.PI) / n
      return `${(cx + rr(i) * Math.cos(a)).toFixed(2)} ${(cy + dy + rr(i) * Math.sin(a)).toFixed(2)}`
    }).join('L') + 'z'
  if (shape === 0) return poly(3, 0, () => r * 1.1, r * 0.2) // a little lower, so it looks centred
  if (shape === 1) return poly(4, Math.PI / 4, () => r * 1.05)
  if (shape === 2) return poly(6, 0, () => r)
  return poly(10, 0, (i) => (i % 2 ? r * 0.48 : r * 1.12))
}

/** Low-contrast background stripes; direction 0 is horizontal, each step turns 45° clockwise. */
const stripes = (dir: number, on = true): CSSProperties => (!on ? {} : {
  backgroundImage: `repeating-linear-gradient(${dir * 45}deg, #3f3f46 0 2px, transparent 2px 12px)`,
})

export function CellView({ cell }: { cell: Cell }) {
  const r = RADIUS * SCALE[cell.count - 1] * INNER
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      {SPOTS[cell.count - 1].map(([x, y], i) => (
        <path
          key={i}
          d={shapePath(cell.shape, 50 + (x - 50) * INNER, 50 + (y - 50) * INNER, r)}
          className={`stroke-zinc-200 ${FILL[cell.fill]}`}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}
      {EDGE.map(([x, y], i) => ((cell.dots >> i) & 1 ? <circle key={i} cx={x} cy={y} r="3.6" className="fill-violet-400" /> : null))}
    </svg>
  )
}

/** A cell with its background: the board's cells, the options and the answer shown after a mistake. */
function CellBox({ cell, plain = false, className = '' }: { cell: Cell; plain?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border bg-zinc-900 ${className}`} style={stripes(cell.stripe, !plain)}>
      <CellView cell={cell} />
    </div>
  )
}

type Phase = 'play' | 'reveal'

/**
 * The run's clock: counts `total` down while `running` (paused on the screen after a mistake), minus `lostMs`
 * (penalties, read on every tick). Calls onEnd once when it reaches 0.
 */
function useRunClock(total: number, running: boolean, lostMs: number, onEnd: () => void) {
  const used = useRef(0)
  const [usedNow, setUsedNow] = useState(0)
  const end = useLatest(onEnd)
  const lost = useLatest(lostMs)
  useEffect(() => {
    if (!running) return
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const u = used.current + performance.now() - start
      setUsedNow(u)
      if (total - u - lost.current <= 0) return end.current()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      used.current += performance.now() - start
    }
  }, [running, total, end, lost])
  return Math.max(0, total - usedNow - lostMs)
}

export default function MatrixPuzzlesTest({ onFinish }: TestComponentProps) {
  const [solved, setSolved] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [lost, setLost] = useState(0)
  const [puzzle, setPuzzle] = useState(() => makePuzzle(1))
  const [phase, setPhase] = useState<Phase>('play')
  // After a mistake: the picked option and the time it cost; the right one shows in green.
  const [picked, setPicked] = useState<{ i: number; cost: number } | null>(null)
  const plain = !puzzle.stripes
  const [flash, signal] = useAnswerFlash()
  const shownAt = useRef(0)
  const solveTimes = useRef<number[]>([])
  const highest = useRef(1)
  // A quick miss (under 15 s) gets the same rules once more with new values, so guessing can't skip a hard puzzle.
  const retryRules = useRef<Rule[] | undefined>(undefined)
  const isRetry = useRef(false)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [puzzle])

  const finish = () => {
    const times = solveTimes.current
    onFinish({
      score: solved,
      ...(solved + wrong === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: [
          { label: 'Wrong answers', value: wrong ? `${wrong} (−${Math.round(lost / 1000)} s)` : '0' },
          ...(times.length ? [{ label: 'Avg time per solved puzzle', value: fmtMs(times.reduce((a, b) => a + b, 0) / times.length) }] : []),
          { label: 'Highest level', value: String(highest.current) },
        ],
      },
    })
  }

  const remaining = useRunClock(DURATION_MS, phase === 'play', lost, finish)

  const next = (s: number, keep?: Rule[]) => {
    const level = levelOf(s)
    highest.current = Math.max(highest.current, level)
    isRetry.current = !!keep
    setPuzzle(makePuzzle(level, Math.random, keep))
  }

  // The mistake stays on screen until you go on (click anywhere, Enter or Space); the clock waits.
  useContinue(
    () => {
      if (remaining <= 0) return finish()
      setPicked(null)
      setPhase('play')
      next(solved, retryRules.current)
    },
    { enabled: phase === 'reveal' },
  )

  const answer = (i: number) => {
    if (phase !== 'play' || remaining <= 0) return
    const spent = performance.now() - shownAt.current
    if (spent < INPUT_LOCK_MS) return
    if (i !== puzzle.answer) {
      const cost = Math.min(penaltyMs(spent), remaining)
      retryRules.current = spent < PENALTY_MS && !isRetry.current ? puzzle.rules : undefined
      setWrong((w) => w + 1)
      setLost((l) => l + cost)
      setPicked({ i, cost })
      setPhase('reveal')
      signal(false)
      return
    }
    solveTimes.current.push(spent)
    signal(true)
    const s = solved + 1
    setSolved(s)
    next(s)
  }
  const secs = Math.ceil(remaining / 1000)
  return (
    <>
      <GameInfo
        left={<><InfoValue value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} unit="left" /><InfoValue label="Level" value={puzzle.level} /></>}
        middle={picked ? <span className="text-rose-300">Not this one · −{Math.round(picked.cost / 1000)} s</span> : 'Which figure completes the grid?'}
        right={<InfoValue label="Solved" value={solved} />}
        timer={remaining / DURATION_MS}
      />
      <SquarePanelLayout
        boardClassName={feedbackRing(flash)}
        board={
          <div className="grid size-full grid-cols-3 gap-2 p-3">
            {puzzle.cells.map((c, i) =>
              i < 8 ? (
                <CellBox key={i} cell={c} plain={plain} className="border-zinc-800" />
              ) : picked ? (
                <CellBox key={i} cell={c} plain={plain} className="border-2 border-emerald-400" />
              ) : (
                <div key={i} className="grid place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-4xl font-bold text-zinc-600">?</div>
              ),
            )}
          </div>
        }
        panel={
          picked ? (
            <div className="flex h-full flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <CellBox cell={puzzle.options[picked.i]} plain={plain} className="aspect-square border-2 border-rose-400" />
                <CellBox cell={puzzle.options[puzzle.answer]} plain={plain} className="aspect-square border-2 border-emerald-400" />
                <p className="-mt-2 text-center text-xs text-rose-300">Your answer</p>
                <p className="-mt-2 text-center text-xs text-emerald-300">Right answer</p>
              </div>
              <p className="mt-auto text-center text-xs text-zinc-600">
                {remaining > 0 ? 'Click anywhere to continue' : 'Click anywhere to see your result'}
              </p>
            </div>
          ) : (
            <div className="grid h-full grid-cols-2 grid-rows-4 gap-2">
              {puzzle.options.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    e.preventDefault()
                    answer(i)
                  }}
                  className="play-area cursor-pointer overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-500"
                  style={stripes(c.stripe, !plain)}
                >
                  <CellView cell={c} />
                </button>
              ))}
            </div>
          )
        }
      />
    </>
  )
}
