import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { LIVES, crackTime, passwordFor, scoreBits, showMs, strengthLabel, type Password } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

/** A space is hard to see when comparing, so it is drawn as ␣ there. */
const visible = (c: string) => (c === ' ' ? '␣' : c)

const TEXT = 'font-mono text-3xl font-semibold tracking-[0.08em] whitespace-pre'

/** A labelled box that looks like a form field. */
function Field({ label, children, tone = '' }: { label: string; children: ReactNode; tone?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-400">{label}</p>
      <div className={`flex h-16 items-center overflow-hidden rounded-xl border bg-zinc-950 px-4 transition-colors ${tone || 'border-zinc-700'}`}>
        {children}
      </div>
    </div>
  )
}

export default function PasswordMemoryTest({ onFinish }: TestComponentProps) {
  const [level, setLevel] = useState(1)
  const [password, setPassword] = useState<Password>(() => passwordFor(1))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState('')
  const [lives, setLives] = useState(LIVES)
  const [capsLock, setCapsLock] = useState(false)
  // Strongest password confirmed so far (the score is its strength in whole bits).
  const [best, setBest] = useState<Password | null>(null)
  // Strength of each missed password, for the result.
  const [missed, setMissed] = useState<number[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()
  const field = useRef<HTMLInputElement>(null)

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

  const submit = () => {
    if (phase !== 'input' || input === '') return
    const ok = input === target
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

  // The confirm field has the focus while you type; a key pressed elsewhere puts it back there.
  useEffect(() => {
    if (phase !== 'input') return
    field.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      setCapsLock(e.getModifierState?.('CapsLock') ?? false)
      if (document.activeElement !== field.current) field.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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

  // After a mistake both passwords stay until you continue (click, Enter or Space; ignored for 300 ms so the Enter
  // that saved the wrong password doesn't skip it): a new password of the same level, or the result.
  useContinue(() => (lives > 0 ? play(level) : finish()), { enabled: phase === 'wrong' })

  const heading = phase === 'show' ? 'Memorize the password'
    : phase === 'input' ? 'Confirm the password'
    : phase === 'correct' ? 'Password saved'
    : 'Passwords do not match'
  const message = phase === 'wrong'
    ? <span className="text-zinc-500">{lives > 0 ? 'Click anywhere to try a new password' : 'Click anywhere to see your result'}</span>
    : phase === 'input' && capsLock ? <span className="text-amber-300">Caps Lock is on</span>
    : null

  return (
    <>
      <GameInfo
        left={<><InfoValue value={scoreBits(password.bits)} unit="bits" /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Memorize'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? 'Saved'
              : lives > 0 ? 'No match · new password, same strength' : 'Out of lives'}
          </span>
        }
        right={<InfoValue label="Score" value={score} unit="bits" />}
        timer={phase === 'show' ? showLeft / showFor : undefined}
      />
      <FullLayout className={`flex flex-col items-center border border-zinc-800 bg-zinc-900/85 px-10 py-8 ${feedbackRing(flash)}`}>
        <p className={`text-2xl font-semibold ${phase === 'wrong' ? 'text-rose-300' : phase === 'correct' ? 'text-emerald-300' : 'text-zinc-100'}`}>
          {heading}
        </p>

        <div className="mt-8 w-full max-w-xl space-y-5">
          <Field label="Password" tone={phase === 'wrong' ? 'border-zinc-500' : ''}>
            {phase === 'show' && <span className={`${TEXT} text-zinc-50`}>{target}</span>}
            {phase === 'wrong' && <span className={`${TEXT} text-zinc-50`}>{[...target].map(visible).join('')}</span>}
            {(phase === 'input' || phase === 'correct') && (
              <span className="text-2xl tracking-[0.25em] text-zinc-400">{'●'.repeat(target.length)}</span>
            )}
          </Field>

          <Field
            label="Confirm password"
            tone={phase === 'input' ? 'border-violet-500' : phase === 'correct' ? 'border-emerald-500' : phase === 'wrong' ? 'border-rose-500' : ''}
          >
            {phase === 'wrong' ? (
              <span className={TEXT}>
                {[...input].map((c, i) => (
                  <span key={i} className={c === target[i] ? 'text-zinc-50' : 'text-rose-400 line-through'}>{visible(c)}</span>
                ))}
                {/* Characters you left out, as gaps. */}
                <span className="text-rose-400/70">{'_'.repeat(Math.max(0, target.length - input.length))}</span>
              </span>
            ) : (
              <input
                ref={field}
                value={input}
                disabled={phase !== 'input'}
                maxLength={target.length + 5}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submit()
                  }
                }}
                // No typing into the field while the rules are open over the game, and no pasting.
                onBeforeInput={(e) => {
                  if (document.querySelector('[role="dialog"]')) e.preventDefault()
                }}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                aria-label="Confirm password"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className={`${TEXT} w-full bg-transparent text-violet-200 caret-violet-400 outline-none select-text disabled:text-emerald-200`}
              />
            )}
          </Field>
          <p className="h-5 text-sm">{message}</p>
        </div>

        <button
          type="button"
          disabled={phase === 'show' || phase === 'correct' || (phase === 'input' && input === '')}
          onPointerDown={(e) => {
            e.preventDefault() // keep the focus in the field
            submit()
          }}
          className="mt-auto h-12 w-48 rounded-xl bg-violet-600 text-lg font-semibold text-white active:bg-violet-700 disabled:opacity-40"
        >
          {phase === 'wrong' ? 'Continue' : 'Save password'}
        </button>
      </FullLayout>
    </>
  )
}
