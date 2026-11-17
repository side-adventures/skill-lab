import { useCallback, useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { StartTransition } from '../../components/game/GameFrame'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown, useLatest } from '../../lib/hooks'
import { answerStats } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { DURATION_MS, KEYS, PART_MS, ROW_LENGTH, SYMBOLS, makeKey, makeSymbolSource, partPoints, symbolScore, type Answer } from './scoring'

const HALF = KEYS.length / 2

function Glyph({ index, className }: { index: number; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={SYMBOLS[index]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SymbolCodeTest({ onFinish }: TestComponentProps) {
  const [key] = useState(() => makeKey())
  const [next] = useState(() => makeSymbolSource())
  // The code row: answers (index into KEYS) whose symbols are shown; [0] is the one to answer now.
  const [row, setRow] = useState(() => Array.from({ length: ROW_LENGTH }, () => next()))
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  // First the empty layout with a 3-2-1 (no symbols yet), so you can put your fingers on the keys; then the minute runs.
  const [playing, setPlaying] = useState(false)
  const startedAt = useRef(0)
  const shownAt = useRef(0)
  useEffect(() => {
    if (playing) startedAt.current = shownAt.current = performance.now()
  }, [playing])
  const go = useCallback(() => setPlaying(true), [])
  const answers = useRef<(Answer & { ms: number })[]>([])

  const remaining = useCountdown(DURATION_MS, playing, () => {
    onFinish({
      score: symbolScore(correct, wrong),
      ...(correct + wrong === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: answerStats(answers.current),
        chips: {
          title: 'Each 20 seconds',
          items: partPoints(answers.current).map((p, i) => ({
            label: `${(i * PART_MS) / 1000}–${((i + 1) * PART_MS) / 1000} s`,
            value: `${p < 0 ? '−' : ''}${Math.abs(p)} ${Math.abs(p) === 1 ? 'pt' : 'pts'}`,
          })),
        },
      },
    })
  })

  const answer = (n: number) => {
    if (!playing || remaining <= 0) return
    const now = performance.now()
    const ok = n === row[0]
    answers.current.push({ at: now - startedAt.current, ms: now - shownAt.current, correct: ok })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setRow([...row.slice(1), next()])
  }

  // Number keys 1–6 work too, in the same order as S D F · J K L (the letters are handled by the answer buttons).
  const answerRef = useLatest(answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const n = Number(e.key) - 1
      if (!(n >= 0 && n < KEYS.length)) return
      e.preventDefault()
      answerRef.current(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerRef])

  const pad = (from: number) => (
    <AnswerButtons
      columns={HALF}
      disabled={remaining <= 0}
      options={KEYS.slice(from, from + HALF).map((k, j) => ({
        label: k.toUpperCase(),
        key: k,
        hint: String(from + j + 1),
        onPress: () => answer(from + j),
      }))}
    />
  )

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle={playing ? 'Press the key for the first symbol' : 'Fingers on S D F and J K L'}
        right={<InfoValue label="Score" value={symbolScore(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="flex flex-col items-center gap-10">
            <div className="flex gap-6" aria-label="Key">
              {[0, HALF].map((from) => (
                <div key={from} className="flex overflow-hidden rounded-xl border border-zinc-700">
                  {key.slice(from, from + HALF).map((s, j) => (
                    <div key={j} className="flex w-16 flex-col items-center border-r border-zinc-700 last:border-r-0">
                      {playing ? <Glyph index={s} className="my-2 size-9 text-zinc-200" /> : <span className="my-2 size-9" />}
                      <span className="relative w-full border-t border-zinc-700 bg-zinc-900 py-1 text-center text-lg font-bold text-zinc-300">
                        {KEYS[from + j].toUpperCase()}
                        <span className="absolute top-0.5 right-1.5 text-[11px] font-medium text-zinc-500">{from + j + 1}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex h-24 items-end gap-3">
              {!playing && <div className="grid h-24 w-[26rem] place-items-center"><StartTransition mode="countdown" onDone={go} /></div>}
              {playing && row.map((n, i) => (
                <div
                  key={i}
                  className={`grid place-items-center rounded-xl border-2 ${
                    i === 0 ? 'size-24 border-violet-400 bg-violet-500/10 text-violet-200' : 'size-16 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Glyph index={key[n]} className={i === 0 ? 'size-14' : 'size-9'} />
                </div>
              ))}
            </div>
          </div>
        }
        answers={
          <div className="mx-auto flex max-w-xl gap-8">
            <div className="flex-1">{pad(0)}</div>
            <div className="flex-1">{pad(HALF)}</div>
          </div>
        }
      />
    </>
  )
}
