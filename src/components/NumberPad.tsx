import { useEffect, useRef } from 'react'
import { useLatest } from '../lib/hooks'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Receives the submitted value (avoids reading stale parent state on fast input). */
  onSubmit: (value: string) => void
  maxLength?: number
  disabled?: boolean
  /** 'row': one line (1–9, 0, ⌫, OK) for below the stage; 'grid': classic 3 × 4 keypad. */
  layout?: 'row' | 'grid'
}

/** On-screen digit keypad (touch friendly) that also accepts the physical keyboard. */
export function NumberPad({ value, onChange, onSubmit, maxLength = 4, disabled, layout = 'grid' }: Props) {
  // Tracks the latest value synchronously, so several keys between renders all count.
  const current = useRef(value)
  useEffect(() => {
    current.current = value
  }, [value])

  const set = (next: string) => {
    current.current = next
    onChange(next)
  }

  const press = (key: string) => {
    if (disabled) return
    const v = current.current
    if (key === '⌫') set(v.slice(0, -1))
    else if (key === 'OK') {
      if (v !== '') {
        onSubmit(v)
        current.current = ''
      }
    } else if (v.length < maxLength) set(v === '0' ? key : v + key)
  }
  const pressRef = useLatest(press)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key)
      else if (e.key === 'Backspace') pressRef.current('⌫')
      else if (e.key === 'Enter') pressRef.current('OK')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pressRef])

  const row = layout === 'row'
  const keys = row
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫', 'OK']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']
  return (
    <div className={`play-area mx-auto grid gap-2 ${row ? 'w-full grid-cols-[repeat(10,minmax(0,1fr))_minmax(0,1fr)_minmax(0,1.6fr)]' : 'max-w-xs grid-cols-3'}`}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          aria-label={k === '⌫' ? 'Delete' : k === 'OK' ? 'Submit' : k}
          onPointerDown={(e) => {
            e.preventDefault()
            press(k)
          }}
          className={`h-14 rounded-xl text-xl font-semibold transition-colors disabled:opacity-40 ${
            k === 'OK'
              ? 'bg-violet-600 text-white active:bg-violet-700'
              : 'bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:active:bg-zinc-700'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  )
}
