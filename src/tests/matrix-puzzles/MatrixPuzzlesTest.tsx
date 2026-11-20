import { useEffect, useId, useRef, useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { END_MOMENT_MS, feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useLatest } from '../../lib/hooks'
import { fmtMs } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { LIVES, changingOf, levelOf, makePuzzle, puzzleMs, type Cell } from './scoring'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8']

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
const RADIUS = [9, 13, 17, 22]

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

export function CellView({ cell }: { cell: Cell }) {
  const id = useId()
  const r = RADIUS[cell.size] * SCALE[cell.count - 1]
  const fillClass = ['', '', 'fill-zinc-500', 'fill-zinc-200'][cell.fill]
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <defs>
        <pattern id={`${id}-s`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2" height="5" className="fill-zinc-300" />
        </pattern>
      </defs>
      {SPOTS[cell.count - 1].map(([x, y], i) => (
        <path
          key={i}
          d={shapePath(cell.shape, x, y, r)}
          className={`stroke-zinc-200 ${fillClass}`}
          fill={cell.fill === 0 ? 'none' : cell.fill === 1 ? `url(#${id}-s)` : undefined}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

type Phase = 'play' | 'reveal'

/** Counts `ms` down while `running`, from the start again whenever `key` changes; calls onEnd once at 0. */
function usePuzzleClock(ms: number, running: boolean, key: unknown, onEnd: () => void) {
  // The remaining time belongs to one puzzle (key); a new puzzle shows the full time until its first tick.
  const [state, setState] = useState<{ key: unknown; left: number }>({ key, left: ms })
  const end = useLatest(onEnd)
  useEffect(() => {
    if (!running) return
    const until = performance.now() + ms
    let raf = 0
    const tick = () => {
      const left = Math.max(0, until - performance.now())
      setState({ key, left })
      if (left <= 0) return end.current()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ms, running, key, end])
  return state.key === key ? state.left : ms
}

export default function MatrixPuzzlesTest({ onFinish }: TestComponentProps) {
  const [solved, setSolved] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [puzzle, setPuzzle] = useState(() => makePuzzle(1))
  const [phase, setPhase] = useState<Phase>('play')
  // After a mistake: the picked option (null = time ran out); the right one shows in green.
  const [picked, setPicked] = useState<number | null>(null)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()
  const shownAt = useRef(0)
  const solveTimes = useRef<number[]>([])
  const clicks = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [puzzle])

  const limit = puzzleMs(solved)
  const finish = (finalSolved: number) => {
    const times = solveTimes.current
    onFinish({
      score: finalSolved,
      ...(clicks.current === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: [
          { label: 'Most changing features', value: finalSolved ? String(changingOf(levelOf(finalSolved - 1))) : '–' },
          ...(times.length ? [{ label: 'Avg time per solved puzzle', value: fmtMs(times.reduce((a, b) => a + b, 0) / times.length) }] : []),
        ],
      },
    })
  }

  const mistake = (i: number | null) => {
    setPicked(i)
    setPhase('reveal')
    signal(false)
    const left = lives - 1
    setLives(left)
    later(END_MOMENT_MS, () => {
      if (left <= 0) return finish(solved)
      setPicked(null)
      setPhase('play')
      setPuzzle(makePuzzle(levelOf(solved)))
    })
  }

  // The clock restarts with every new puzzle.
  const remaining = usePuzzleClock(limit, phase === 'play', puzzle, () => mistake(null))

  const answer = (i: number) => {
    if (phase !== 'play') return
    clicks.current++
    if (i !== puzzle.answer) return mistake(i)
    solveTimes.current.push(performance.now() - shownAt.current)
    signal(true)
    const s = solved + 1
    setSolved(s)
    setPuzzle(makePuzzle(levelOf(s)))
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

  const middle = phase === 'reveal' ? (picked === null ? 'Time is up' : 'Not this one') : 'Which figure completes the grid?'
  return (
    <>
      <GameInfo
        left={<><InfoValue value={Math.ceil(remaining / 1000)} unit="s" /><Lives left={lives} total={LIVES} /></>}
        middle={phase === 'reveal' ? <span className="text-rose-300">{middle}</span> : middle}
        right={<InfoValue label="Solved" value={solved} />}
        timer={phase === 'play' ? remaining / limit : 0}
      />
      <SquarePanelLayout
        boardClassName={feedbackRing(flash)}
        board={
          <div className="grid size-full grid-cols-3 gap-2 p-3">
            {puzzle.cells.map((c, i) =>
              i < 8 ? (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-1"><CellView cell={c} /></div>
              ) : phase === 'reveal' ? (
                <div key={i} className="rounded-lg border-2 border-emerald-400 bg-zinc-900 p-1"><CellView cell={c} /></div>
              ) : (
                <div key={i} className="grid place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-4xl font-bold text-zinc-600">?</div>
              ),
            )}
          </div>
        }
        panel={
          <div className="grid h-full grid-cols-2 grid-rows-4 gap-2">
            {puzzle.options.map((c, i) => {
              const state = phase !== 'reveal' ? '' : i === puzzle.answer ? 'border-emerald-400 ring-2 ring-emerald-400/60' : i === picked ? 'border-rose-400 ring-2 ring-rose-400/65' : 'opacity-40'
              return (
                <button
                  key={i}
                  type="button"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    e.preventDefault()
                    answer(i)
                  }}
                  className={`play-area relative rounded-lg border border-zinc-700 bg-zinc-900 p-1 transition-colors hover:border-zinc-500 ${state}`}
                >
                  <CellView cell={c} />
                  <span className="absolute top-0.5 left-1.5 text-[11px] font-medium text-zinc-500">{KEYS[i]}</span>
                </button>
              )
            })}
          </div>
        }
      />
    </>
  )
}
