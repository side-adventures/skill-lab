import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import {
  DEFAULT_OPTIONS, KINDS, KIND_NAMES, LEVELS, makeLabPuzzle, type Level, type LabCell, type LabOptions, type LabPuzzle, type NumberRule,
} from './lab'

// ---- drawing ---------------------------------------------------------------------------------------------------------

const poly = (n: number, x: number, y: number, r: number, rot = 0, rr?: (i: number) => number) => 'M' + Array.from({ length: n }, (_, i) => {
  const a = -Math.PI / 2 + rot + (i * 2 * Math.PI) / n
  const R = rr ? rr(i) : r
  return `${(x + R * Math.cos(a)).toFixed(2)} ${(y + R * Math.sin(a)).toFixed(2)}`
}).join('L') + 'z'
/** triangle, square, circle, star, cross, heart, moon, arrow, bolt */
const SHAPES: ((x: number, y: number, r: number) => string)[] = [
  (x, y, r) => poly(3, x, y + r * 0.18, r * 1.12),
  (x, y, r) => poly(4, x, y, r * 1.05, Math.PI / 4),
  (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`,
  (x, y, r) => poly(10, x, y, r, 0, (i) => (i % 2 ? r * 0.48 : r * 1.15)),
  (x, y, r) => { const a = r * 0.36, b = r; return `M${x - a} ${y - b}h${2 * a}v${b - a}h${b - a}v${2 * a}h${a - b}v${b - a}h${-2 * a}v${a - b}h${a - b}v${-2 * a}h${b - a}z` },
  (x, y, r) => `M${x} ${y + r * 0.95}C${x - r * 1.5} ${y - r * 0.1} ${x - r * 0.75} ${y - r * 1.25} ${x} ${y - r * 0.45}C${x + r * 0.75} ${y - r * 1.25} ${x + r * 1.5} ${y - r * 0.1} ${x} ${y + r * 0.95}z`,
  (x, y, r) => `M${x + r * 0.3} ${y - r * 0.95}A${r} ${r} 0 1 0 ${x + r * 0.3} ${y + r * 0.95}A${r} ${r} 0 0 1 ${x + r * 0.3} ${y - r * 0.95}z`,
  (x, y, r) => `M${x - r} ${y - r * 0.32}h${r}v${-r * 0.55}l${r} ${r * 0.87}l${-r} ${r * 0.87}v${-r * 0.55}h${-r}z`,
  (x, y, r) => `M${x + r * 0.25} ${y - r * 1.1}L${x - r * 0.7} ${y + r * 0.15}H${x - r * 0.05}L${x - r * 0.3} ${y + r * 1.1}L${x + r * 0.7} ${y - r * 0.2}H${x + r * 0.05}z`,
]
const FILL = ['fill-zinc-950', 'fill-zinc-500', 'fill-zinc-100']
/**
 * White shapes get a black outline, so a white shape on (or in) a white one still shows. It sits under the fill
 * (only its outer half shows), so small white shapes keep their full size.
 */
const WHITE_EDGE = { className: 'stroke-zinc-950', strokeWidth: 2, paintOrder: 'stroke' } as const
const Shape = ({ s, x, y, r, fill }: { s: number; x: number; y: number; r: number; fill: number }) => (
  <path d={SHAPES[s](x, y, r)} className={`${fill === 2 ? WHITE_EDGE.className : 'stroke-zinc-200'} ${FILL[fill]}`} strokeWidth={fill === 2 ? WHITE_EDGE.strokeWidth : 1} paintOrder={fill === 2 ? WHITE_EDGE.paintOrder : undefined} strokeLinejoin="round" />
)
/** Spots for 1–8 copies (inside the ring of dots) and how big the copies are. */
const SPOTS: [number, number][][] = [
  [[50, 50]], [[33, 50], [67, 50]], [[50, 35], [33, 65], [67, 65]], [[35, 35], [65, 35], [35, 65], [65, 65]],
  [[31, 31], [69, 31], [50, 50], [31, 69], [69, 69]], [[29, 38], [50, 38], [71, 38], [29, 62], [50, 62], [71, 62]],
  [[29, 30], [50, 30], [71, 30], [50, 50], [29, 70], [50, 70], [71, 70]],
  [[29, 30], [50, 30], [71, 30], [39, 50], [61, 50], [29, 70], [50, 70], [71, 70]],
  [[29, 29], [50, 29], [71, 29], [29, 50], [50, 50], [71, 50], [29, 71], [50, 71], [71, 71]],
]
const COPY_R = [17, 10, 10, 9.5, 7.5, 7, 6, 6, 6]
/** Shape sets: 1–4 shapes in one row, in their order. */
const SET_X = [[50], [38, 62], [28, 50, 72], [23, 41, 59, 77]]
const EDGE: [number, number][] = [[8, 8], [50, 8], [92, 8], [92, 50], [92, 92], [50, 92], [8, 92], [8, 50]]
const QUAD = ['#09090b', '#71717a', '#f4f4f5']

function Figure({ kind, c }: { kind: LabPuzzle['kind']; c: LabCell }) {
  const n = (v: unknown) => v as number
  const l = (v: unknown) => v as number[]
  if (kind === 'copies') {
    const count = n(c.count)
    return <>{SPOTS[count - 1].map(([x, y], i) => <Shape key={i} s={n(c.shape)} x={x} y={y} r={COPY_R[count - 1]} fill={n(c.fill)} />)}</>
  }
  if (kind === 'order') return <>{l(c.order).map((s, i) => <Shape key={i} s={s} x={26 + i * 24} y={50} r={10} fill={n(c.fill)} />)}</>
  if (kind === 'nest') {
    const [o, i] = l(c.nest)
    return <><Shape s={o} x={50} y={50} r={25} fill={n(c.ofill)} /><Shape s={i} x={50} y={o === 0 ? 55 : 50} r={9} fill={n(c.ifill)} /></>
  }
  if (kind === 'set') {
    const xs = l(c.set)
    return <>{xs.map((s, i) => <Shape key={i} s={s} x={SET_X[xs.length - 1][i]} y={50} r={xs.length === 4 ? 7.5 : 9} fill={n(c.fill)} />)}</>
  }
  return <>{l(c.quad).map((v, i) => <rect key={i} x={31 + (i % 2) * 20} y={31 + Math.floor(i / 2) * 20} width={18} height={18} rx={2} fill={QUAD[v]} className={v === 2 ? WHITE_EDGE.className : 'stroke-zinc-200'} strokeWidth={v === 2 ? WHITE_EDGE.strokeWidth : 1} paintOrder={v === 2 ? WHITE_EDGE.paintOrder : undefined} />)}</>
}

const stripes = (dir: number): CSSProperties => (dir < 0 ? {} : { backgroundImage: `repeating-linear-gradient(${dir * 45}deg, #3f3f46 0 2px, transparent 2px 12px)` })

function Cell({ p, c, className = '' }: { p: LabPuzzle; c: LabCell; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border bg-zinc-900 ${className}`} style={stripes(c.stripe as number)}>
      <svg viewBox="0 0 100 100" className="size-full">
        <Figure kind={p.kind} c={c} />
        {EDGE.map(([x, y], i) => (((c.dots as number) >> i) & 1 ? <circle key={i} cx={x} cy={y} r="3.6" className="fill-violet-400" /> : null))}
      </svg>
    </div>
  )
}

// ---- settings and log (kept in this browser) -------------------------------------------------------------------------

interface LogRow { ids: string[]; kind: string; ms: number; right: boolean }
const STORE = 'skill-lab:matrix-lab'
function load(): { opts: LabOptions; log: LogRow[] } {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) ?? 'null')
    if (d?.opts && Array.isArray(d.log)) return { opts: { ...DEFAULT_OPTIONS, ...d.opts }, log: d.log }
  } catch { /* fall through */ }
  return { opts: DEFAULT_OPTIONS, log: [] }
}
function save(opts: LabOptions, log: LogRow[]) {
  try { localStorage.setItem(STORE, JSON.stringify({ opts, log: log.slice(-500) })) } catch { /* not saved */ }
}

function Chip({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); onPress() }}
      className={`rounded-md border px-1.5 py-0.5 text-[11px] ${on ? 'border-violet-400/70 bg-violet-500/20 text-zinc-100' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
    >
      {children}
    </button>
  )
}
const NUMBER_NAMES: Record<NumberRule, string> = { double: 'Doubling', grid: 'Row × column', plus: 'A + B', step: '±1' }
const DOTS = ['off', 'easy', 'hard', 'mixed'] as const

const LEVEL_CLASS: Record<Level, string> = { easy: 'text-emerald-300', medium: 'text-amber-300', hard: 'text-rose-300' }
const LevelTag = ({ level }: { level?: Level }) => (level ? <span className={`ml-1 text-[10px] uppercase tracking-wide ${LEVEL_CLASS[level]}`}>{level}</span> : null)

function median(xs: number[]) { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0 }

function LogTable({ log }: { log: LogRow[] }) {
  const by = new Map<string, LogRow[]>()
  for (const r of log) for (const id of [`figure:${r.kind}`, ...r.ids]) by.set(id, [...(by.get(id) ?? []), r])
  const rows = [...by].sort(([a], [b]) => a.localeCompare(b))
  return (
    <div className="h-full overflow-auto text-xs">
      <table className="w-full tabular-nums">
        <thead className="text-zinc-500"><tr><th className="text-left font-normal">Rule</th><th className="font-normal">Level</th><th className="font-normal">Tried</th><th className="font-normal">Right</th><th className="font-normal">Median time</th></tr></thead>
        <tbody>
          {rows.map(([id, rs]) => (
            <tr key={id} className="border-t border-zinc-800">
              <td className="py-0.5 text-zinc-300">{id}</td>
              <td className="text-center"><LevelTag level={LEVELS[id]} /></td>
              <td className="text-center">{rs.length}</td>
              <td className="text-center">{Math.round((100 * rs.filter((r) => r.right).length) / rs.length)} %</td>
              <td className="text-center">{(median(rs.map((r) => r.ms)) / 1000).toFixed(1)} s</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="mt-4 text-zinc-500">Nothing answered yet.</p>}
    </div>
  )
}

// ---- the lab ---------------------------------------------------------------------------------------------------------

export default function MatrixLabTest({ onFinish }: TestComponentProps) {
  const [{ opts, log }, setData] = useState(load)
  const [puzzle, setPuzzle] = useState(() => makeLabPuzzle(opts))
  const [picked, setPicked] = useState<number | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [session, setSession] = useState({ tried: 0, right: 0 })
  const [flash, signal] = useAnswerFlash()
  const shownAt = useRef(0)
  useEffect(() => { shownAt.current = performance.now() }, [puzzle])
  useEffect(() => save(opts, log), [opts, log])

  const setOpts = (f: (o: LabOptions) => LabOptions) => setData((d) => ({ ...d, opts: f(d.opts) }))
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

  const answer = (i: number) => {
    if (picked !== null || performance.now() - shownAt.current < 400) return
    const right = i === puzzle.answer
    setPicked(i)
    signal(right)
    setSession((s) => ({ tried: s.tried + 1, right: s.right + +right }))
    setData((d) => ({ ...d, log: [...d.log, { ids: puzzle.rules.map((r) => r.id), kind: puzzle.kind, ms: performance.now() - shownAt.current, right }] }))
  }
  const next = () => {
    setPicked(null)
    setPuzzle(makeLabPuzzle(opts))
  }
  useActionKey(next, picked !== null && !showLog)
  const finish = () => onFinish({ score: session.right, ...(session.tried === 0 && { failed: 'No answers — try a few puzzles!' }) })

  const done = picked !== null
  return (
    <>
      <GameInfo
        left={<InfoValue label="Tried" value={session.tried} />}
        middle={done ? (picked === puzzle.answer ? <span className="text-emerald-300">Right</span> : <span className="text-rose-300">Not this one</span>) : `${KIND_NAMES[puzzle.kind]} · which figure completes the grid?`}
        right={<InfoValue label="Right" value={session.right} />}
      />
      <FullLayout className="grid grid-cols-[minmax(0,22rem)_10.5rem_minmax(0,1fr)] items-center gap-3 border border-zinc-800 bg-zinc-900/85 p-3">
        <div className={`grid aspect-square w-full grid-cols-3 gap-1.5 rounded-xl bg-zinc-950/70 p-2 ${feedbackRing(flash)}`}>
          {puzzle.cells.map((c, i) => i < 8 || done
            ? <Cell key={i} p={puzzle} c={c} className={i === 8 ? 'border-2 border-emerald-400' : 'border-zinc-800'} />
            : <div key={i} className="grid place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-3xl font-bold text-zinc-600">?</div>)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {puzzle.options.map((c, i) => (
            <button key={i} type="button" className="play-area aspect-square cursor-pointer" onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); answer(i) }}>
              <Cell p={puzzle} c={c} className={`size-full ${done && i === puzzle.answer ? 'border-2 border-emerald-400' : done && i === picked ? 'border-2 border-rose-400' : 'border-zinc-700 hover:border-zinc-500'}`} />
            </button>
          ))}
        </div>
        <div className="flex h-full min-h-0 flex-col gap-2 self-stretch text-xs">
          {showLog ? <LogTable log={log} /> : done ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <p className="mb-1 font-medium text-zinc-300">The rules</p>
              <ul className="list-disc space-y-1 pl-4 text-zinc-400">
                {puzzle.rules.map((r, i) => <li key={i} className={r.part === puzzle.focus ? 'text-zinc-200' : ''}>{r.text}<LevelTag level={r.level} /></li>)}
                <li className="text-zinc-600">Everything else stays the same.</li>
              </ul>
              <button type="button" onPointerDown={(e) => { e.preventDefault(); next() }} className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500">Next puzzle</button>
              <p className="mt-1 text-[11px] text-zinc-600">or Enter / Space</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-2 overflow-auto">
              <p className="text-zinc-500">Changes apply from the next puzzle.</p>
              <div>
                <p className="mb-1 text-zinc-400">Figures</p>
                <div className="flex flex-wrap gap-1">{KINDS.map((k) => <Chip key={k} on={opts.kinds.includes(k)} onPress={() => setOpts((o) => ({ ...o, kinds: toggle(o.kinds, k) }))}>{KIND_NAMES[k]}</Chip>)}</div>
              </div>
              <div>
                <p className="mb-1 text-zinc-400">Number rules (copies)</p>
                <div className="flex flex-wrap gap-1">{(['double', 'grid', 'plus', 'step'] as NumberRule[]).map((k) => <Chip key={k} on={opts.numbers.includes(k)} onPress={() => setOpts((o) => ({ ...o, numbers: toggle(o.numbers, k) }))}>{NUMBER_NAMES[k]}</Chip>)}</div>
              </div>
              <div>
                <p className="mb-1 text-zinc-400">Dots</p>
                <div className="flex flex-wrap gap-1">{DOTS.map((d) => <Chip key={d} on={opts.dots === d} onPress={() => setOpts((o) => ({ ...o, dots: d }))}>{d}</Chip>)}</div>
              </div>
              <div>
                <p className="mb-1 text-zinc-400">Changes per puzzle</p>
                <div className="flex flex-wrap gap-1">
                  <Chip on={opts.twoHard} onPress={() => setOpts((o) => ({ ...o, twoHard: true }))}>2, none easy (figure + dots)</Chip>
                  <Chip on={!opts.twoHard} onPress={() => setOpts((o) => ({ ...o, twoHard: false }))}>Mixed</Chip>
                </div>
                {opts.twoHard && <p className="mt-1 text-[11px] text-zinc-600">Dots, stripes and fill switches don't apply.</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Chip on={opts.stripes} onPress={() => setOpts((o) => ({ ...o, stripes: !o.stripes }))}>Stripes</Chip>
                <Chip on={opts.cols} onPress={() => setOpts((o) => ({ ...o, cols: !o.cols }))}>Columns too</Chip>
              </div>
            </div>
          )}
          <div className="mt-auto flex gap-1.5">
            <Chip on={showLog} onPress={() => setShowLog((s) => !s)}>{showLog ? 'Close log' : `Log (${log.length})`}</Chip>
            <span className="flex-1" />
            <Chip on={false} onPress={finish}>Finish</Chip>
          </div>
        </div>
      </FullLayout>
    </>
  )
}
