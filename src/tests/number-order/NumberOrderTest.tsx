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
      result={(cleared, { memorizeUsed, tileMs }) => ({
        score: cleared ? numberOrderTiles(cleared - 1) : 0,
        // Not even the first round: no score (shown, not saved), like Flash Order.
        ...(!cleared && { failed: 'Not even the first round — try again!' }),
        details: {
          stats: [
            { label: 'Rounds cleared', value: String(cleared) },
            { label: 'Failed with', value: `${START_TILES + cleared} tiles` },
            ...(tileMs.length ? [{ label: 'Avg time per tile', value: fmtMs(tileMs.reduce((a, b) => a + b, 0) / tileMs.length) }] : []),
            ...(memorizeUsed.length ? [{ label: 'Memorize time used', value: fmtMs(memorizeUsed[memorizeUsed.length - 1].ms) }] : []),
          ],
          chips: { title: 'Memorize time used', items: memorizeUsed.map((m) => ({ label: `Round ${m.round + 1}`, value: fmtMs(m.ms) })) },
        },
      })}
      onFinish={onFinish}
    />
  )
}
