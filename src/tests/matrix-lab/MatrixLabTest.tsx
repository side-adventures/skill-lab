import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import {
  DEFAULT_OPTIONS, KINDS, KIND_NAMES, LEVELS, LEVEL_RANK, makeLabPuzzle, type Level, type Part, type LabCell, type LabOptions, type LabPuzzle, type NumberRule,
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
 * A white inner shape (shape in shape) gets a black outline, so it also shows on a white outer shape. It sits under
 * the fill (only its outer half shows), so the shape keeps its size. All other shapes keep the light outline (a dark
 * edge would vanish on the dark cell and make white copies look smaller).
 */
const WHITE_EDGE = { className: 'stroke-zinc-950', strokeWidth: 2, paintOrder: 'stroke' } as const
/** `inner`: the inner shape of shape in shape; white ones get the black outline, all others the light one. */
const Shape = ({ s, x, y, r, fill, inner = false }: { s: number; x: number; y: number; r: number; fill: number; inner?: boolean }) => {
  const black = fill === 2 && inner
  return <path d={SHAPES[s](x, y, r)} className={`${black ? WHITE_EDGE.className : 'stroke-zinc-200'} ${FILL[fill]}`} strokeWidth={black ? WHITE_EDGE.strokeWidth : 1} paintOrder={black ? WHITE_EDGE.paintOrder : undefined} strokeLinejoin="round" />
}
/** Spots for 1–9 copies (inside the ring of dots) and how big the copies are. */
const SPOTS: [number, number][][] = [
  [[50, 50]], [[33, 50], [67, 50]], [[50, 35], [33, 65], [67, 65]], [[35, 35], [65, 35], [35, 65], [65, 65]],
  [[31, 31], [69, 31], [50, 50], [31, 69], [69, 69]], [[29, 38], [50, 38], [71, 38], [29, 62], [50, 62], [71, 62]],
  [[27, 27], [50, 27], [73, 27], [50, 50], [27, 73], [50, 73], [73, 73]],
  [[27, 27], [50, 27], [73, 27], [38, 50], [62, 50], [27, 73], [50, 73], [73, 73]],
  [[27, 27], [50, 27], [73, 27], [27, 50], [50, 50], [73, 50], [27, 73], [50, 73], [73, 73]],
]
const COPY_R = [17, 10, 10, 9.5, 7.5, 7, 7.5, 7.5, 7.5]
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
    return <><Shape s={o} x={50} y={50} r={25} fill={n(c.ofill)} /><Shape s={i} x={50} y={o === 0 ? 55 : 50} r={9} fill={n(c.ifill)} inner /></>
  }
  if (kind === 'set') {
    const xs = l(c.set)
    return <>{xs.map((s, i) => <Shape key={i} s={s} x={SET_X[xs.length - 1][i]} y={50} r={xs.length === 4 ? 7.5 : 9} fill={n(c.fill)} />)}</>
  }
  return <>{l(c.quad).map((v, i) => <rect key={i} x={31 + (i % 2) * 20} y={31 + Math.floor(i / 2) * 20} width={18} height={18} rx={2} fill={QUAD[v]} className="stroke-zinc-200" strokeWidth="1" />)}</>
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

/** One answer. Older rows have only ids, kind, ms and right. */
interface LogRow {
  ids: string[]
  kind: string
  ms: number
  right: boolean
  /** When it was answered (ISO). */
  at?: string
  mode?: string
  level?: number
  /** The rule levels, sorted, e.g. "easy+medium+medium". */
  combo?: string
  /** Each rule's direction, in the order of `ids`. */
  dirs?: string[]
  /** The part the options split on. */
  focus?: string
  /** The part the wrong pick got wrong (its value differed from the answer). */
  missed?: string[]
}
const comboOf = (levels: string[]) => [...levels].sort((a, b) => LEVEL_RANK[a as Level] - LEVEL_RANK[b as Level]).join(' + ')
const STORE = 'skill-lab:matrix-lab'
function load(): { opts: LabOptions; log: LogRow[] } {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) ?? 'null')
    if (d?.opts && Array.isArray(d.log)) return { opts: { ...DEFAULT_OPTIONS, ...d.opts }, log: d.log }
  } catch { /* fall through */ }
  return { opts: DEFAULT_OPTIONS, log: [] }
}
function save(opts: LabOptions, log: LogRow[]) {
  try { localStorage.setItem(STORE, JSON.stringify({ opts, log: log.slice(-3000) })) } catch { /* not saved */ }
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

type Group = 'rule' | 'combo' | 'level' | 'figure'
const GROUPS: [Group, string][] = [['rule', 'Rule'], ['combo', 'Combination'], ['level', 'Level'], ['figure', 'Figure + combination']]
const keysOf = (r: LogRow, g: Group): string[] =>
  g === 'rule' ? [`figure:${r.kind}`, ...r.ids]
  : g === 'level' ? [r.level ? `level ${r.level}` : 'no level']
  : g === 'combo' ? [r.combo ?? '(old row)']
  : [`${r.kind} · ${r.combo ?? '?'}`]

/** Saves the log as a JSON file, for a closer look later. */
function download(log: LogRow[]) {
  const blob = new Blob([JSON.stringify({ lab: 'matrix-lab', exportedAt: new Date().toISOString(), log }, null, 1)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `matrix-lab-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function LogTable({ log }: { log: LogRow[] }) {
  const [group, setGroup] = useState<Group>('combo')
  const [onlyLevel, setOnlyLevel] = useState<number | null>(null)
  const rowsIn = onlyLevel ? log.filter((r) => r.level === onlyLevel) : log
  const by = new Map<string, LogRow[]>()
  for (const r of rowsIn) for (const k of keysOf(r, group)) by.set(k, [...(by.get(k) ?? []), r])
  const rows = [...by].sort(([a], [b]) => a.localeCompare(b))
  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 text-xs">
      <div className="flex flex-wrap gap-1">{GROUPS.map(([g, t]) => <Chip key={g} on={group === g} onPress={() => setGroup(g)}>{t}</Chip>)}</div>
      <div className="flex flex-wrap gap-1">
        <Chip on={onlyLevel === null} onPress={() => setOnlyLevel(null)}>All levels</Chip>
        {[1, 2, 3, 4, 5].map((l) => <Chip key={l} on={onlyLevel === l} onPress={() => setOnlyLevel(l)}>{l}</Chip>)}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full tabular-nums">
          <thead className="text-zinc-500"><tr><th className="text-left font-normal">{GROUPS.find(([g]) => g === group)![1]}</th>{group === 'rule' && <th className="font-normal">Level</th>}<th className="font-normal">Tried</th><th className="font-normal">Right</th><th className="font-normal">Median</th></tr></thead>
          <tbody>
            {rows.map(([id, rs]) => (
              <tr key={id} className="border-t border-zinc-800">
                <td className="py-0.5 text-zinc-300">{id}</td>
                {group === 'rule' && <td className="text-center"><LevelTag level={LEVELS[id]} /></td>}
                <td className="text-center">{rs.length}</td>
                <td className="text-center">{Math.round((100 * rs.filter((r) => r.right).length) / rs.length)} %</td>
                <td className="text-center">{(median(rs.map((r) => r.ms)) / 1000).toFixed(1)} s</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="mt-4 text-zinc-500">Nothing answered yet.</p>}
      </div>
      <div><Chip on={false} onPress={() => download(log)}>Download data ({log.length})</Chip></div>
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
    const pick = puzzle.options[i]
    const row: LogRow = {
      ids: puzzle.rules.map((r) => r.id), kind: puzzle.kind, ms: Math.round(performance.now() - shownAt.current), right,
      at: new Date().toISOString(), mode: opts.mode, level: puzzle.level, combo: comboOf(puzzle.rules.map((r) => r.level)),
      dirs: puzzle.rules.map((r) => r.dir), focus: puzzle.focus,
      ...(!right && { missed: (Object.keys(pick) as Part[]).filter((pt) => JSON.stringify(pick[pt]) !== JSON.stringify(puzzle.cells[8][pt])) }),
    }
    setData((d) => ({ ...d, log: [...d.log, row] }))
  }
  const next = () => {
    setPicked(null)
    setPuzzle(makeLabPuzzle(opts, Math.random, session.tried + 1))
  }
  useActionKey(next, picked !== null && !showLog)
  const finish = () => onFinish({ score: session.right, ...(session.tried === 0 && { failed: 'No answers — try a few puzzles!' }) })

  const done = picked !== null
  return (
    <>
      <GameInfo
        left={<><InfoValue label="Tried" value={session.tried} />{puzzle.level && <InfoValue label="Level" value={puzzle.level} />}</>}
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
                  <Chip on={opts.mode === 'levels'} onPress={() => setOpts((o) => ({ ...o, mode: 'levels' }))}>Levels</Chip>
                  <Chip on={opts.mode === 'random2'} onPress={() => setOpts((o) => ({ ...o, mode: 'random2' }))}>2 random rules</Chip>
                  <Chip on={opts.mode === 'twoHard'} onPress={() => setOpts((o) => ({ ...o, mode: 'twoHard' }))}>2, none easy</Chip>
                  <Chip on={opts.mode === 'mixed'} onPress={() => setOpts((o) => ({ ...o, mode: 'mixed' }))}>Mixed</Chip>
                </div>
                {opts.mode === 'levels' && (
                  <>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Chip on={opts.fixedLevel === null} onPress={() => setOpts((o) => ({ ...o, fixedLevel: null }))}>Level by number</Chip>
                      {[1, 2, 3, 4, 5].map((l) => <Chip key={l} on={opts.fixedLevel === l} onPress={() => setOpts((o) => ({ ...o, fixedLevel: l }))}>{l}</Chip>)}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-600">By number: puzzle 1, 2, 3–4, 5–6, 7+. Dots and stripes can be among the changes when on.</p>
                  </>
                )}
                {opts.mode === 'random2' && <p className="mt-1 text-[11px] text-zinc-600">Any 2 rules at any level, at least one on the figure: the best mix for timing each rule.</p>}
                {opts.mode === 'twoHard' && <p className="mt-1 text-[11px] text-zinc-600">Figure + dots. Dots, stripes and fill switches don't apply.</p>}
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
