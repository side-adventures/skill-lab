import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import type { TestComponentProps } from '../types'
import {
  COLS, OPEN_MS, PENALTY_MS, ROWS, calendarScore, makeLayout, roundTime, switchCostPerDoor, type Door, type RoundResult as Result,
} from './scoring'

const STAR = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6Z'
const TREE = 'M12 2l6 8h-3l5 7h-7v5h-2v-5H4l5-7H6Z'

function KindIcon({ kind, className }: { kind: 'star' | 'tree'; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={kind === 'star' ? STAR : TREE} fill="currentColor" />
    </svg>
  )
}

const KIND_LOOK: Record<Door['kind'], string> = {
  plain: 'border-zinc-600 bg-zinc-800 text-zinc-100',
  star: 'border-amber-400/70 bg-amber-950/50 text-amber-100',
  tree: 'border-emerald-400/70 bg-emerald-950/50 text-emerald-100',
}

const Star = () => <KindIcon kind="star" className="inline size-4 -translate-y-px text-amber-300" />
const Tree = () => <KindIcon kind="tree" className="inline size-4 -translate-y-px text-emerald-300" />
const SWITCH_TASK: ReactNode = (
  <>Alternate: <Star />1 → <Tree />12 → <Star />2 → <Tree />11 …</>
)

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`

export default function AdventCalendarTest({ onFinish }: TestComponentProps) {
  const [round, setRound] = useState(0)
  const [layout, setLayout] = useState(() => makeLayout(0))
  const [next, setNext] = useState(0) // how many doors are done
  const [wrong, setWrong] = useState(0)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [first, setFirst] = useState<Result | null>(null)
  const [between, setBetween] = useState(false)
  const [now, setNow] = useState(0)
  const startedAt = useRef(0)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // A running clock for the info row while a round is played.
  useEffect(() => {
    if (between) return
    startedAt.current = performance.now()
    const id = window.setInterval(() => setNow(performance.now() - startedAt.current), 100)
    return () => window.clearInterval(id)
  }, [between, round])

  const click = (cell: number) => {
    if (between || next >= layout.order.length) return
    if (cell !== layout.order[next]) {
      if (layout.order.indexOf(cell) < next) return // an already opened door: ignored
      setWrong(wrong + 1)
      setWrongAt(cell)
      signal(false)
      later(350, () => setWrongAt((w) => (w === cell ? null : w)))
      return
    }
    setOpenAt(cell)
    later(OPEN_MS, () => setOpenAt((o) => (o === cell ? null : o)))
    if (next + 1 < layout.order.length) return setNext(next + 1)
    // Round done.
    const res = { ms: performance.now() - startedAt.current, wrong }
    setNext(next + 1)
    signal(true)
    if (round === 0) {
      setFirst(res)
      return later(OPEN_MS, () => setBetween(true))
    }
    const a = first!
    const cost = switchCostPerDoor(a, res)
    onFinish({
      score: calendarScore([a, res]),
      details: {
        stats: [
          { label: 'Wrong doors, round 1', value: String(a.wrong) },
          { label: 'Wrong doors, round 2', value: String(res.wrong) },
        ],
        extra: {
          kind: 'pair',
          a: { label: 'In order', value: secs(roundTime(a)) },
          b: { label: 'Alternating', value: secs(roundTime(res)) },
          diff: { label: 'Switching cost', value: `${cost >= 0 ? '+' : '−'}${Math.abs(Math.round(cost))} ms per door` },
        },
      },
    })
  }

  const startRound2 = () => {
    setRound(1)
    setLayout(makeLayout(1))
    setNext(0)
    setWrong(0)
    setNow(0)
    setOpenAt(null)
    setBetween(false)
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${round + 1}`} of={2} />}
        middle={between ? '' : round === 0 ? 'Open the doors in order: 1 → 2 → 3 …' : SWITCH_TASK}
        right={!between && <InfoValue value={((now + wrong * PENALTY_MS) / 1000).toFixed(1)} unit="s" />}
      />
      <FullLayout className={`grid place-items-center bg-zinc-900 ${feedbackRing(flash)}`}>
        {between && first ? (
          <RoundResult
            value={(roundTime(first) / 1000).toFixed(1)}
            unit="s"
            line={<>Round 1 done · next, alternate: <Star />1 → <Tree />12 → <Star />2 → <Tree />11 …</>}
            onContinue={startRound2}
          />
        ) : (
          <div
            className="grid size-full gap-2.5 p-3"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
          >
            {layout.cells.map((door, cell) => {
              const open = cell === openAt
              return (
                <button
                  key={`${round}-${cell}`}
                  type="button"
                  aria-label={`${door.kind === 'plain' ? 'Door' : door.kind === 'star' ? 'Star door' : 'Tree door'} ${door.n}`}
                  onPointerDown={(e) => e.button === 0 && click(cell)}
                  className={`relative grid cursor-pointer place-items-center rounded-lg border-2 ${
                    cell === wrongAt ? 'border-rose-400 bg-rose-700 text-white'
                    : open ? 'border-violet-400/60 bg-zinc-950 text-violet-300/50'
                    : `${KIND_LOOK[door.kind]} hover:brightness-125`
                  }`}
                >
                  {door.kind !== 'plain' && !open && (
                    <KindIcon kind={door.kind} className={`absolute top-1.5 left-1.5 size-5 ${door.kind === 'star' ? 'text-amber-300' : 'text-emerald-300'}`} />
                  )}
                  {open ? <span className="size-6 rounded-full bg-violet-400/70" /> : <span className="text-3xl font-bold tabular-nums">{door.n}</span>}
                </button>
              )
            })}
          </div>
        )}
      </FullLayout>
    </>
  )
}
