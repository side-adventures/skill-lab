import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { GAP_MS, PADS, TOTAL, curve, makePlan, patternBonus, type Press } from './scoring'

/** Keys for the pads, left to right (number keys 1–4 also work). */
const KEYS = ['d', 'f', 'j', 'k']

export default function PatternGrooveTest({ onFinish }: TestComponentProps) {
  const [plan] = useState(makePlan)
  const [i, setI] = useState(0)
  const [lit, setLit] = useState(true) // false during the short gap after a right press
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const litAt = useRef(0)
  const clean = useRef(true)
  const presses = useRef<Press[]>([])
  const wrongCount = useRef(0)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // The clock starts when the pad is drawn lit (the same for every press, so it cancels out in the bonus).
  useLayoutEffect(() => {
    if (lit) litAt.current = performance.now()
  }, [lit, i])

  const finish = () => {
    const ps = presses.current
    const b = patternBonus(ps)
    onFinish({
      score: b?.bonus ?? 0,
      details: {
        stats: [
          { label: 'On the pattern', value: b ? `${b.pattern} ms` : '–' },
          { label: 'On the random part', value: b ? `${b.random} ms` : '–' },
          { label: 'Wrong keys', value: String(wrongCount.current) },
        ],
        chips: {
          title: 'Each 12 presses (median)',
          items: curve(ps).map((c, k) => ({ label: c.kind === 'random' ? `${k + 1} (random)` : String(k + 1), value: c.ms === undefined ? '–' : `${Math.round(c.ms)} ms` })),
        },
      },
    })
  }

  const press = (pad: number) => {
    if (!lit) return // during the gap: ignored
    if (pad !== plan[i].pad) {
      clean.current = false
      wrongCount.current++
      setWrongAt(pad)
      signal(false)
      later(200, () => setWrongAt((w) => (w === pad ? null : w)))
      return
    }
    presses.current.push({ kind: plan[i].kind, ms: performance.now() - litAt.current, clean: clean.current })
    clean.current = true
    if (i + 1 >= TOTAL) return finish()
    setLit(false)
    later(GAP_MS, () => {
      setI(i + 1)
      setLit(true)
    })
  }

  const pressRef = useLatest(press)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      const pad = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : Number(k) - 1
      if (!(pad >= 0 && pad < PADS)) return
      e.preventDefault()
      pressRef.current(pad)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pressRef])

  const current = lit ? plan[i].pad : -1
  return (
    <>
      <GameInfo
        left={<InfoValue value={i + 1} of={TOTAL} />}
        middle="Press the lit pad, as fast as you can"
        timer={1 - i / TOTAL}
      />
      <FullLayout className={`grid place-items-center bg-zinc-900 ${feedbackRing(flash)}`}>
        <div className="flex gap-6">
          {Array.from({ length: PADS }, (_, p) => (
            <button
              key={p}
              type="button"
              aria-label={`Pad ${KEYS[p].toUpperCase()}${p === current ? ', lit' : ''}`}
              onPointerDown={(e) => e.button === 0 && press(p)}
              className={`relative grid size-32 cursor-pointer place-items-center rounded-2xl ${
                p === wrongAt ? 'bg-rose-700' : p === current ? 'bg-violet-500' : 'bg-zinc-700'
              }`}
            >
              {p === current && <span className="size-10 rounded-full bg-white" />}
              <kbd className="absolute bottom-2 rounded-md border border-white/20 px-1.5 text-xs text-white/50">{KEYS[p].toUpperCase()}</kbd>
            </button>
          ))}
        </div>
      </FullLayout>
    </>
  )
}
