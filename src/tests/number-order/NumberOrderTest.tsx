import type { TestComponentProps } from '../types'
import { fmtMs } from '../../lib/resultFormat'
import { OrderGame } from './OrderGame'
import { NUMBER_ORDER_MS, START_TILES, numberOrderTiles } from './scoring'

export default function NumberOrderTest({ onFinish }: TestComponentProps) {
  return (
    <OrderGame
      tilesFor={numberOrderTiles}
      memorizeMsFor={() => NUMBER_ORDER_MS}
      roundLabel={(r) => `Round ${r + 1}`}
      roundUnit={(_, tiles) => `${tiles} tiles`}
      scoreSoFar={(cleared) => ({ value: String(cleared ? numberOrderTiles(cleared - 1) : 0), unit: 'tiles' })}
      result={(cleared, { memorizeUsed, tileMs }) => ({
        // Not even the first round: an honest 0 (you played, but completed no round).
        score: cleared ? numberOrderTiles(cleared - 1) : 0,
        details: {
          stats: [
            { label: 'Rounds cleared', value: String(cleared) },
            { label: 'Failed with', value: `${START_TILES + cleared} tiles` },
            ...(tileMs.length ? [{ label: 'Avg time per tile', value: fmtMs(tileMs.reduce((a, b) => a + b, 0) / tileMs.length) }] : []),
          ],
          chips: { title: 'Memorize time used', items: memorizeUsed.map((m) => ({ label: `Round ${m.round + 1}`, value: fmtMs(m.ms) })) },
        },
      })}
      onFinish={onFinish}
    />
  )
}
