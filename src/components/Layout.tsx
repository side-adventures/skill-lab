import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { allScoresShare } from '../lib/allScores'
import { ComingSoonButton } from './ComingSoon'
import { Logo } from './Logo'
import { SettingsIcon, ShareIcon, StatsIcon } from './HeaderIcons'
import { ShareButton } from './ShareButton'

export function Layout({ children }: { children: ReactNode }) {
  // The home page uses the full width for its card grid; test pages stay narrower so play areas
  // (and therefore scores) don't change with the window size.
  const wide = useLocation().pathname === '/'
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <Logo />
          Skill Lab
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton label="Share scores" icon={<ShareIcon />} variant="primary" size="sm" getShare={allScoresShare} />
          <ComingSoonButton
            label="Stats"
            icon={<StatsIcon />}
            text="Coming soon: your best scores, progress and trends in one place."
          />
          <ComingSoonButton
            label="Settings"
            icon={<SettingsIcon />}
            text="Coming soon: export, import and reset your scores, and more options."
          />
        </div>
      </header>
      <main className={`w-full flex-1 pb-10 ${wide ? '' : 'mx-auto max-w-3xl'}`}>{children}</main>
      <footer className="py-6 text-center text-xs text-zinc-500">
        No sign-up, no tracking. Scores are saved only in this browser.
      </footer>
    </div>
  )
}
