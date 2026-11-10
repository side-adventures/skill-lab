// All test icons (src/icons/<test-id>.svg), bundled as SVG markup. They use currentColor,
// so they take the text color of wherever they're placed.
const ICONS = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true })

const svgFor = (id: string) => ICONS[`../icons/${id}.svg`]

/**
 * A test's icon. Falls back to the registry emoji when there's no SVG yet.
 * (The emoji is still used in shared text messages, which can't contain images.)
 */
export function TestIcon({ id, emoji, className = 'size-9', style }: { id: string; emoji: string; className?: string; style?: React.CSSProperties }) {
  const svg = svgFor(id)
  if (!svg) return <span className="text-3xl leading-none" aria-hidden>{emoji}</span>
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 [&>svg]:size-full ${className}`}
      style={style}
      // Our own static files from src/icons, not user input.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
