import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { DrainBar } from '../../components/DrainBar'
import { NumberPad } from '../../components/NumberPad'
import { BelowStage } from '../../components/Stage'
import type { TestComponentProps } from '../types'
import { START_DIGITS, makeNumber, showMs } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

export default function NumberMemoryTest({ onFinish }: TestComponentProps) {
  const [digits, setDigits] = useState(START_DIGITS)
  const [number, setNumber] = useState(() => makeNumber(START_DIGITS))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    let t: number | undefined
    if (phase === 'show') t = window.setTimeout(() => setPhase('input'), showMs(digits))
    if (phase === 'correct')
      t = window.setTimeout(() => {
        setDigits(digits + 1)
        setNumber(makeNumber(digits + 1))
        setInput('')
        setPhase('show')
      }, 1000)
    return () => window.clearTimeout(t)
  }, [phase, digits])

  const submit = (value: string) => {
    setAnswer(value)
    setPhase(value === number ? 'correct' : 'wrong')
  }

  const finish = () =>
    onFinish({
      score: digits - 1 >= START_DIGITS ? digits - 1 : 0,
      details: { 'Last number': number, 'You typed': answer },
    })

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 text-sm text-zinc-500">{digits} digits</div>
      <div className="grid min-h-0 flex-1 place-items-center rounded-2xl bg-white p-6 text-center dark:bg-zinc-900">
        {phase === 'show' && (
          <div className="w-full">
            <p className="mb-6 font-mono text-4xl font-bold tracking-[0.2em] break-all sm:text-5xl">{number}</p>
            <DrainBar key={number} ms={showMs(digits)} />
          </div>
        )}
        {phase === 'input' && (
          <div>
            <p className="mb-2 text-zinc-500">What was the number?</p>
            <p className="min-h-12 font-mono text-4xl font-bold tracking-[0.2em] break-all text-violet-600 dark:text-violet-400">
              {input || <span className="text-zinc-300 dark:text-zinc-700">_</span>}
            </p>
          </div>
        )}
        {phase === 'correct' && <p className="text-3xl font-bold text-emerald-500">Correct!</p>}
        {phase === 'wrong' && (
          <div className="space-y-2 font-mono text-2xl break-all sm:text-3xl">
            <p><span className="font-sans text-sm text-zinc-500">Number </span>{number}</p>
            <p>
              <span className="font-sans text-sm text-zinc-500">You </span>
              {[...answer].map((d, i) => (
                <span key={i} className={d === number[i] ? '' : 'text-rose-500 line-through'}>{d}</span>
              ))}
            </p>
          </div>
        )}
      </div>
      {phase === 'wrong' && (
        <div className="mt-4 text-center"><Button onClick={finish} autoFocus>See result</Button></div>
      )}
      <BelowStage>
        <NumberPad value={input} onChange={setInput} onSubmit={submit} maxLength={digits} disabled={phase !== 'input'} layout="row" />
      </BelowStage>
    </div>
  )
}
