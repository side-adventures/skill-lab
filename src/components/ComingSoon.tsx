import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Header icon button that opens a small "coming soon" note. Closes on outside click or Escape. */
export function ComingSoonButton({ label, icon, text }: { label: string; icon: ReactNode; text: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-9 place-items-center rounded-lg border transition-colors ${
          open ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
        }`}
      >
        {icon}
      </button>
      {open && (
        <div role="dialog" aria-label={label} className="absolute top-11 right-0 z-10 w-60 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <span className="text-violet-300">{icon}</span>
            {label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{text}</p>
        </div>
      )}
    </div>
  )
}
