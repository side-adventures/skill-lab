import { CATEGORIES, CATEGORY_COLORS, type Category } from '../tests/types'

const ALL_COLOR = '#a78bfa' // violet-400, for the "All" chip

/** "All" + one chip per category; the selected chip takes its category color. */
export function CategoryChips({ value, onChange }: { value: Category | null; onChange: (c: Category | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <Chip label="All" color={ALL_COLOR} active={!value} onClick={() => onChange(null)} />
      {CATEGORIES.map((c) => (
        <Chip key={c} label={c} color={CATEGORY_COLORS[c]} dot active={value === c} onClick={() => onChange(c)} />
      ))}
    </div>
  )
}

function Chip({ label, color, dot, active, onClick }: {
  label: string
  color: string
  dot?: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active ? '' : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      style={active ? { color, background: `${color}26`, borderColor: `${color}66` } : undefined}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  )
}
