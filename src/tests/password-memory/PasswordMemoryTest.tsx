import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown, useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { LIVES, crackTime, passwordFor, scoreBits, showMs, strengthLabel, type Password } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

/** A space is hard to see in the comparison after a mistake, so it is drawn as ␣ there. */
const visible = (c: string) => (c === ' ' ? '␣' : c)

export default function PasswordMemoryTest({ onFinish }: TestComponentProps) {
  const [level, setLevel] = useState(1)
  const [password, setPassword] = useState<Password>(() => passwordFor(1))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [lives, setLives] = useState(LIVES)
  const [capsLock, setCapsLock] = useState(false)
  // Strongest password confirmed so far (the score is its strength in whole bits).
  const [best, setBest] = useState<Password | null>(null)
  // Strength of each missed password, for the result.
  const [missed, setMissed] = useState<number[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  const target = password.text
  const showFor = showMs(target)
  const showLeft = useCountdown(showFor, phase === 'show', () => setPhase('input'))
  const score = best ? scoreBits(best.bits) : 0

  const play = (next: number) => {
    setLevel(next)
    setPassword(passwordFor(next))
    setInput('')
    setPhase('show')
  }

  // The typed text, tracked synchronously so fast typing between renders all counts.
  const typed = useRef('')
  const setTyped = (v: string) => {
    typed.current = v
    setInput(v)
  }

  const submit = () => {
    const value = typed.current
    if (phase !== 'input' || value === '') return
    setAnswer(value)
    const ok = value === target
    signal(ok)
    if (ok) {
      if (!best || password.bits > best.bits) setBest(password)
      setPhase('correct')
      later(900, () => play(level + 1))
      return
    }
    setMissed([...missed, scoreBits(password.bits)])
    setLives(lives - 1)
    setPhase('wrong')
  }

  const onKey = useLatest((e: KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') setCapsLock(e.getModifierState('CapsLock'))
    if (phase !== 'input') return
    // Leave browser shortcuts alone (AltGr arrives as Ctrl + Alt on Windows, so that still types).
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return
    if (e.key === 'Enter' || e.key === 'NumpadEnter') submit()
    else if (e.key === 'Backspace') setTyped(typed.current.slice(0, -1))
    else if (e.key.length === 1 && typed.current.length < target.length + 5) setTyped(typed.current + e.key)
    else return
    e.preventDefault()
  })
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onKey])
  // Start every password with an empty field.
  useEffect(() => {
    if (phase === 'show') typed.current = ''
  }, [phase])

  const finish = () => {
    onFinish({
      score,
      details: {
        stats: [
          ...(best
            ? [
                { label: 'Strongest', value: best.text },
                { label: 'Strength', value: strengthLabel(best.bits) },
                { label: 'Time to crack', value: crackTime(best.bits) },
              ]
            : []),
          ...(missed.length ? [{ label: 'Missed at', value: `${missed.join(', ')} bits` }] : []),
        ],
      },
    })
  }

  // After a mistake the comparison stays until you continue (click, Enter or Space; ignored for 300 ms so the Enter
  // that confirmed the wrong password doesn't skip it): a new password of the same level, or the result.
  useContinue(() => (lives > 0 ? play(level) : finish()), { enabled: phase === 'wrong' })

  const size = target.length > 14 ? 'text-4xl' : 'text-5xl'
  const mono = `font-mono ${size} font-bold tracking-[0.12em] whitespace-pre`
  return (
    <>
      <GameInfo
        left={<><InfoValue value={scoreBits(password.bits)} unit="bits" /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Memorize the password'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? 'Confirmed'
              : lives > 0 ? 'Passwords do not match · new password, same strength' : 'Out of lives'}
          </span>
        }
        right={<InfoValue label="Score" value={score} unit="bits" />}
        timer={phase === 'show' ? showLeft / showFor : undefined}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="w-full px-8 text-center">
            {phase === 'show' && (
              <>
                <p className="mb-3 text-zinc-500">Password</p>
                <p className={`${mono} text-zinc-50`}>{target}</p>
              </>
            )}
            {(phase === 'input' || phase === 'correct') && (
              <>
                <p className="mb-3 text-zinc-500">Confirm password</p>
                <p className={`${mono} min-h-14 text-violet-300`}>
                  {input}
                  {phase === 'input' && <span className="animate-pulse text-zinc-600">|</span>}
                </p>
                <p className={`mt-4 h-5 text-sm text-amber-300 ${capsLock && phase === 'input' ? '' : 'invisible'}`}>Caps Lock is on</p>
              </>
            )}
            {phase === 'wrong' && (
              <div className={`font-mono ${target.length > 14 ? 'text-3xl' : 'text-4xl'} font-bold whitespace-pre`}>
                {/* Labels in their own column, so both rows line up character by character. */}
                <div className="mx-auto grid w-fit grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-3 text-left">
                  <span className="text-right font-sans text-sm font-normal text-zinc-500">Password</span>
                  <span>{[...target].map(visible).join('')}</span>
                  <span className="text-right font-sans text-sm font-normal text-zinc-500">You</span>
                  <span>
                    {[...answer].map((c, i) => (
                      <span key={i} className={c === target[i] ? '' : 'text-rose-400 line-through'}>{visible(c)}</span>
                    ))}
                    {/* Characters you left out, as gaps. */}
                    <span className="text-rose-400/70">{'_'.repeat(Math.max(0, target.length - answer.length))}</span>
                  </span>
                </div>
                <p className="pt-5 font-sans text-xs font-normal text-zinc-600">
                  {lives > 0 ? 'Click anywhere to continue' : 'Click anywhere to see your result'}
                </p>
              </div>
            )}
          </div>
        }
        answers={
          <div className={`flex items-center gap-3 ${phase === 'input' ? '' : 'opacity-40'}`}>
            <p className="flex-1 text-sm text-zinc-500">Type with your keyboard. Backspace deletes.</p>
            <button
              type="button"
              disabled={phase !== 'input'}
              onPointerDown={(e) => {
                e.preventDefault()
                submit()
              }}
              className="h-14 w-40 rounded-xl bg-violet-600 text-xl font-semibold text-white active:bg-violet-700 disabled:opacity-60"
            >
              Confirm
            </button>
          </div>
        }
      />
    </>
  )
}
