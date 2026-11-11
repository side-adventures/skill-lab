import type { TestDefinition } from '../tests/types'

/**
 * A test's rules: summary, the skill it tests, "How to play" and "Score" lists.
 * Shared by the rules screen and the in-game rules overlay, so both always show the same text.
 */
export function RulesContent({ test, compact }: { test: TestDefinition; compact?: boolean }) {
  return (
    <div>
      <p className={`font-semibold text-zinc-50 ${compact ? 'text-base' : 'text-xl'}`}>{test.tagline}</p>
      <p className={`mt-1 text-zinc-400 ${compact ? 'text-xs' : 'text-sm'}`}>Tests {test.skill}</p>
      <RuleList title="How to play" items={test.howTo} compact={compact} />
      <RuleList title="Score" items={test.scoring} compact={compact} />
    </div>
  )
}

function RuleList({ title, items, compact }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <section className={compact ? 'mt-3' : 'mt-5'}>
      <h3 className="mb-1.5 text-xs font-medium tracking-wide text-zinc-500 uppercase">{title}</h3>
      <ul className={`space-y-1.5 text-zinc-300 ${compact ? 'text-sm' : 'text-[15px]'}`}>
        {items.map((line) => (
          <li key={line} className="flex gap-2.5 leading-relaxed">
            <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
