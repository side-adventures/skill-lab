import { useRef, useState } from 'react'
import { rollingMean, shortDate } from '../lib/stats'
import type { ResultEntry } from '../lib/storage'

const W = 600
const H = 180
const PAD_L = 66 // room for the y labels
const PAD_R = 10
const TOP = 12
const BOTTOM = 26 // room for the attempt numbers
const DOTS_UP_TO = 50

/**
 * Attempts graph (x = attempt number). Better is always up, whatever the test's direction.
 * Faded score line, dots while there are ≤ 50 attempts (shrinking as they grow), the average of
 * the last 5 as the main line, and your all-time best as a white dot (only if that attempt is still
 * in the history). Hover shows any attempt.
 */
export function AttemptGraph({ history, best, firstNumber, color, higherIsBetter, format }: {
  history: ResultEntry[]
  /** All-time best; may be older than the history. */
  best: ResultEntry
  /** Attempt number of history[0] (older attempts may have been dropped). */
  firstNumber: number
  color: string
  higherIsBetter: boolean
  format: (score: number) => string
}) {
  const svg = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const scores = history.map((e) => e.score)
  const n = scores.length
  const lo = Math.min(...scores)
  const hi = Math.max(...scores)
  const bestScore = higherIsBetter ? hi : lo
  // White dot only on the actual all-time best attempt, if it's still in the history.
  const bestIndex = history.findIndex((e) => e.at === best.at && e.score === best.score)

  const x = (i: number) => (n === 1 ? (PAD_L + W - PAD_R) / 2 : PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R))
  const y = (v: number) => {
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo) // 0 = lowest score
    return TOP + (higherIsBetter ? 1 - t : t) * (H - TOP - BOTTOM)
  }
  const path = (vals: (number | undefined)[]) =>
    vals.reduce<string>((d, v, i) => (v === undefined ? d : `${d}${d ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`), '')

  const trend = rollingMean(scores)
  const dotR = n > DOTS_UP_TO ? 0 : Math.max(2.2, Math.min(5, 5.6 - n / 12))
  const worstScore = higherIsBetter ? lo : hi
  const step = n <= 10 ? 1 : n <= 25 ? 5 : n <= 50 ? 10 : 25
  const ticks = [...Array(n).keys()].filter((i) => i === 0 || i === n - 1 || (i + 1) % step === 0)

  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    const vx = ((e.clientX - r.left) / r.width) * W
    setHover(n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((vx - PAD_L) / (W - PAD_L - PAD_R)) * (n - 1)))))
  }

  return (
    <div className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Graph of your last ${n} attempts`}>
        {/* y labels: best and worst */}
        <text x={0} y={y(bestScore) + 4} className="fill-zinc-400 text-[14px]">{format(bestScore)}</text>
        {hi !== lo && <text x={0} y={y(worstScore) + 4} className="fill-zinc-600 text-[14px]">{format(worstScore)}</text>}
        <line x1={PAD_L} x2={W - PAD_R} y1={y(bestScore)} y2={y(bestScore)} stroke="#fafafa" strokeDasharray="2 5" opacity={0.3} />

        {n > 1 && <path d={path(scores)} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.35} />}
        {dotR > 0 &&
          scores.map((v, i) => i !== bestIndex && <circle key={i} cx={x(i)} cy={y(v)} r={dotR} fill={color} opacity={0.55} />)}
        <path d={path(trend)} fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
        {bestIndex >= 0 && <circle cx={x(bestIndex)} cy={y(scores[bestIndex])} r={5.5} fill="#fafafa" stroke="#18181b" strokeWidth={2.5} />}

        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 5} textAnchor="middle" className="fill-zinc-500 text-[13px]">{firstNumber + i}</text>
        ))}

        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={TOP - 6} y2={H - BOTTOM + 4} stroke="#a1a1aa" opacity={0.45} />
            <circle cx={x(hover)} cy={y(scores[hover])} r={4.5} fill="#18181b" stroke="#fafafa" strokeWidth={2} />
          </>
        )}
        <rect
          x={PAD_L - 8} y={0} width={W - PAD_L - PAD_R + 16} height={H - BOTTOM + 6}
          fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
          style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
        >
          <span className="font-semibold text-zinc-50">{format(scores[hover])}</span>
          <span className="text-zinc-400"> · attempt {firstNumber + hover}</span>
          <div className="text-zinc-500">
            {shortDate(history[hover].at)}
            {hover === bestIndex && ' · your best ever'}
          </div>
        </div>
      )}
    </div>
  )
}
