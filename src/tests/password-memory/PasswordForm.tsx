import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, type Flash } from '../../lib/game'

export type FormPhase = 'show' | 'input' | 'correct' | 'wrong'

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

/**
 * The "create a password" form shared by Password Memory and the Password Lab: a heading, a "Password" field (the
 * password, then dots), a "Confirm password" field (a real text input) and a save button. After a mismatch both
 * fields show the passwords, wrong characters crossed out.
 */
export function PasswordForm({ phase, target, input, onInput, onSubmit, flash, wrongHint, footer }: {
  phase: FormPhase
  target: string
  input: string
  onInput: (value: string) => void
  onSubmit: () => void
  flash: Flash
  /** Under the fields after a mismatch, e.g. "Click anywhere to continue". */
  wrongHint: string
  /** Extra controls at the bottom left (the lab's buttons). */
  footer?: ReactNode
}) {
  const field = useRef<HTMLInputElement>(null)
  const [capsLock, setCapsLock] = useState(false)

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

  const heading = phase === 'show' ? 'Memorize the password'
    : phase === 'input' ? 'Confirm the password'
    : phase === 'correct' ? 'Password saved'
    : 'Passwords do not match'
  const message = phase === 'wrong'
    ? <span className="text-zinc-500">{wrongHint}</span>
    : phase === 'input' && capsLock ? <span className="text-amber-300">Caps Lock is on</span>
    : null

  return (
    <FullLayout className={`flex flex-col items-center border border-zinc-800 bg-zinc-900/85 px-10 py-8 ${feedbackRing(flash)}`}>
      <p className={`text-2xl font-semibold ${phase === 'wrong' ? 'text-rose-300' : phase === 'correct' ? 'text-emerald-300' : 'text-zinc-100'}`}>
        {heading}
      </p>

      <div className="mt-8 w-full max-w-xl space-y-5">
        <Field label="Password" tone={phase === 'wrong' ? 'border-zinc-500' : ''}>
          {(phase === 'show' || phase === 'wrong') && <span className={`${TEXT} text-zinc-50`}>{[...target].map(visible).join('')}</span>}
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
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSubmit()
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

      <div className="mt-auto flex w-full items-center">
        <div className="flex flex-1 items-center gap-2">{footer}</div>
        <button
          type="button"
          disabled={phase === 'show' || phase === 'correct' || (phase === 'input' && input === '')}
          onPointerDown={(e) => {
            e.preventDefault() // keep the focus in the field
            if (phase === 'input') onSubmit()
          }}
          className="h-12 w-48 rounded-xl bg-violet-600 text-lg font-semibold text-white active:bg-violet-700 disabled:opacity-40"
        >
          {phase === 'wrong' ? 'Continue' : 'Save password'}
        </button>
        <div className="flex-1" />
      </div>
    </FullLayout>
  )
}
