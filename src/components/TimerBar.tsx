export function TimerBar({ remaining, total, children }: { remaining: number; total: number; children?: React.ReactNode }) {
  const pct = (remaining / total) * 100
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm text-zinc-500">
        <span className="tabular-nums">{(remaining / 1000).toFixed(1)} s</span>
        <span>{children}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${pct < 20 ? 'bg-rose-500' : 'bg-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
