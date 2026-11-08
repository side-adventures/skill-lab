export function testUrl(testId: string, base = window.location.href.split('#')[0]) {
  return `${base}#/test/${testId}`
}

export function buildShareText(testName: string, formattedScore: string) {
  return `I scored ${formattedScore} on ${testName} at Skill Lab — can you beat it?`
}

/** Web Share API where available (mostly mobile), else clipboard. Returns what happened. */
export async function shareResult(text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text, url })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'failed'
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export const homeUrl = (base = window.location.href.split('#')[0]) => base

/** One message listing the player's best score for every test they've played. */
export function buildAllScoresText(scores: { icon: string; name: string; score: string }[]) {
  return [
    'My Skill Lab best scores:',
    ...scores.map((s) => `${s.icon} ${s.name}: ${s.score}`),
    'Can you beat them?',
  ].join('\n')
}
