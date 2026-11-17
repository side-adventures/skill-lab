import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { fmtMs, slowdown } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import {
  COLS, OPEN_MS, PENALTY_MS, ROUNDS, ROWS, calendarScore, makeLayout, roundTime, switchCostPerDoor, type Door, type RoundResult as Result,
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

/**
 * The calendar look: dark red board with a light snow pattern, doors with a thin gold edge and a little knob, numbers
 * in a serif. Round 2's star and tree doors differ by a small icon and a faint tint (warm brown vs dark green), so the
 * two sets are easy to tell apart without bright fills.
 */
const BOARD = 'bg-[#2a0d12] bg-[radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1.5px)] bg-[length:26px_26px]'
const KIND_LOOK: Record<Door['kind'], string> = {
  plain: 'border-amber-600/40 bg-[#4a1a20] text-[#f5e6c8]',
  star: 'border-amber-500/30 bg-[#4d2a16] text-[#f5e6c8]',
  tree: 'border-emerald-500/30 bg-[#1f3a26] text-[#e6f2e6]',
}
const ICON_LOOK = { star: 'text-amber-300/90', tree: 'text-emerald-300/90' } as const

const Star = () => <KindIcon kind="star" className="inline size-4 -translate-y-px text-amber-300" />
const Tree = () => <KindIcon kind="tree" className="inline size-4 -translate-y-px text-emerald-300" />
const SWITCH_TASK: ReactNode = (
  <>Alternate: <Star />1 → <Tree />12 → <Star />2 → <Tree />11 …</>
)

/** A door's name for the hint: "13", or a star / tree icon and its number. */
const DoorName = ({ door }: { door: Door }) => (
  <b className="text-zinc-100">{door.kind === 'star' ? <Star /> : door.kind === 'tree' ? <Tree /> : null}{door.n}</b>
)

/** "1 wrong door (+1 s)", "2 wrong doors (+2 s)". */
const wrongDoors = (n: number) => `${n} wrong ${n === 1 ? 'door' : 'doors'} (+${(n * PENALTY_MS) / 1000} s)`

export default function AdventCalendarTest({ onFinish }: TestComponentProps) {
  const [round, setRound] = useState(0)
  const [layout, setLayout] = useState(() => makeLayout(0))
  const [next, setNext] = useState(0) // how many doors are done
  const [wrong, setWrong] = useState(0)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  // After a wrong door, the info row says which door comes next, until it's opened (so nobody gets stuck).
  const [hint, setHint] = useState(false)
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [first, setFirst] = useState<Result | null>(null)
  const [between, setBetween] = useState(false)
  const [now, setNow] = useState(0)
  const startedAt = useRef(0)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // A running clock for the info row while a round is played; it stops on the last door (the round's time is fixed
  // then, so the clock must not keep counting through the last door's flash).
  const roundOver = next >= layout.order.length
  useEffect(() => {
    if (between || roundOver) return
    startedAt.current = performance.now()
    const id = window.setInterval(() => setNow(performance.now() - startedAt.current), 100)
    return () => window.clearInterval(id)
  }, [between, round, roundOver])

  const click = (cell: number) => {
    if (between || next >= layout.order.length) return
    if (cell !== layout.order[next]) {
      // The door just opened again (a double click): ignored. Any other door, opened before or not, is a wrong door.
      if (next > 0 && cell === layout.order[next - 1]) return
      setWrong(wrong + 1)
      setHint(true)
      setWrongAt(cell)
      signal(false)
      later(350, () => setWrongAt((w) => (w === cell ? null : w)))
      return
    }
    setOpenAt(cell)
    setHint(false)
    later(OPEN_MS, () => setOpenAt((o) => (o === cell ? null : o)))
    if (next + 1 < layout.order.length) return setNext(next + 1)
    // Round done.
    const res = { ms: performance.now() - startedAt.current, wrong }
    setNow(res.ms) // the clock shows the exact round time
    setNext(next + 1)
    signal(true)
    if (round === 0) {
      setFirst(res)
      return later(OPEN_MS, () => setBetween(true))
    }
    const a = first!
    const cost = switchCostPerDoor(a, res)
    // Let the last door's flash show, then the result.
    later(400, () => onFinish({
      score: calendarScore([a, res]),
      details: {
        stats: [
          { label: 'Wrong doors, round 1', value: String(a.wrong) },
          { label: 'Wrong doors, round 2', value: String(res.wrong) },
          { label: 'Round 2 vs round 1', value: `×${(roundTime(res) / roundTime(a)).toFixed(1)}` },
        ],
        extra: {
          kind: 'pair',
          a: { label: 'In order', value: fmtMs(roundTime(a)) },
          b: { label: 'Alternating', value: fmtMs(roundTime(res)) },
          diff: { label: 'Switching cost', value: `${slowdown(cost)} per door` },
        },
      },
    }))
  }

  const startRound2 = () => {
    setRound(1)
    setLayout(makeLayout(1))
    setNext(0)
    setWrong(0)
    setHint(false)
    setNow(0)
    setOpenAt(null)
    setBetween(false)
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${round + 1}`} of={2} />}
        middle={
          between ? ''
          : hint ? <span className="text-rose-300">Next door: <DoorName door={ROUNDS[round][next]} /></span>
          : round === 0 ? 'Open the doors in order: 1 → 2 → 3 …'
          : SWITCH_TASK
        }
        right={!between && <InfoValue label="Time" value={((now + wrong * PENALTY_MS) / 1000).toFixed(1)} unit="s" />}
      />
      <FullLayout className={`grid place-items-center ${BOARD} ${feedbackRing(flash)}`}>
        {between && first ? (
          <RoundResult
            value={(roundTime(first) / 1000).toFixed(1)}
            unit="s"
            line={
              <>
                {first.wrong > 0 && <>{wrongDoors(first.wrong)} · </>}
                Next, alternate: <Star />1 → <Tree />12 → <Star />2 → <Tree />11 …
              </>
            }
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
                  className={`relative grid cursor-pointer place-items-center rounded-md border ${
                    cell === wrongAt ? 'border-rose-400 bg-rose-700 text-white'
                    : open ? 'border-amber-600/30 bg-[#1a0a0c]'
                    : `${KIND_LOOK[door.kind]} hover:brightness-125`
                  }`}
                >
                  {door.kind !== 'plain' && !open && (
                    <KindIcon kind={door.kind} className={`absolute top-1.5 left-1.5 size-4 ${ICON_LOOK[door.kind]}`} />
                  )}
                  {!open && cell !== wrongAt && <span className="absolute top-1/2 right-2 size-1.5 -translate-y-1/2 rounded-full bg-amber-400/70" aria-hidden />}
                  {open ? (
                    <KindIcon kind="star" className="size-7 text-amber-300" />
                  ) : (
                    <span className="font-serif text-3xl font-semibold tabular-nums">{door.n}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </FullLayout>
    </>
  )
}
