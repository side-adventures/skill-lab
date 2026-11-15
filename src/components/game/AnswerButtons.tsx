import { useEffect } from 'react'
import { useLatest } from '../../lib/hooks'

export interface AnswerOption {
  label: string
  /** Keyboard key (KeyboardEvent.key) that also triggers it, shown in the button: '1', 'ArrowLeft', ' ' … */
  key: string
  onPress: () => void
  primary?: boolean
}

const KEY_LABEL: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ' ': 'Space' }
const keyLabel = (key: string) => KEY_LABEL[key] ?? key.toUpperCase()

/** Large answer buttons with their key shown inside; reacts on pointerdown and on the key. */
export function AnswerButtons({ options, columns, disabled, wide }: {
  options: AnswerOption[]
  columns?: number
  disabled?: boolean
  /** Use the full width of the strip (many small buttons, e.g. a 1–9 row). */
  wide?: boolean
}) {
  const latest = useLatest({ options, disabled })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || latest.current.disabled || e.ctrlKey || e.metaKey || e.altKey) return
      const opt = latest.current.options.find((o) => o.key.toLowerCase() === e.key.toLowerCase())
      if (!opt) return
      e.preventDefault()
      opt.onPress()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [latest])

  return (
    <div className={`mx-auto grid gap-3 ${wide ? '' : 'max-w-xl'}`} style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        // A button whose label is its key ("1") shows it once, centered.
        const keyOnly = keyLabel(o.key) === o.label
        return (
        <button
          key={o.label}
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            o.onPress()
          }}
          className={`flex h-14 items-center ${keyOnly ? 'justify-center' : 'justify-between'} rounded-xl px-5 text-lg font-bold tracking-wider transition-colors active:scale-[0.98] disabled:opacity-40 ${
            o.primary ? 'bg-violet-600 text-white hover:bg-violet-500' : 'border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-600'
          }`}
        >
          <span>{o.label}</span>
          {!keyOnly && (
            <kbd className={`rounded-md border px-1.5 text-xs font-medium ${o.primary ? 'border-white/30 text-white/80' : 'border-zinc-700 text-zinc-500'}`}>
              {keyLabel(o.key)}
            </kbd>
          )}
        </button>
        )
      })}
    </div>
  )
}
