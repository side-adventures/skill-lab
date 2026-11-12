import type { TestComponentProps } from '../types'
import { fmtMs } from '../../lib/resultFormat'
import { OrderGame } from '../number-order/OrderGame'
import { START_TILES, flashOrderMs } from '../number-order/scoring'

export default function FlashOrderTest({ onFinish }: TestComponentProps) {
  return (
    <OrderGame
      tilesFor={() => START_TILES}
      memorizeMsFor={flashOrderMs}
      roundLabel={(r) => `Round ${r + 1}`}
      result={(cleared, { tileMs }) =>
        cleared
          ? {
              score: flashOrderMs(cleared - 1),
              details: {
                stats: [
                  { label: 'Rounds cleared', value: String(cleared) },
                  { label: 'Failed at', value: `${flashOrderMs(cleared)} ms` },
                  ...(tileMs.length ? [{ label: 'Avg time per tile', value: fmtMs(tileMs.reduce((a, b) => a + b, 0) / tileMs.length) }] : []),
                ],
              },
            }
          : { score: 0, failed: 'Not even the first round — try again!' }
      }
      onFinish={onFinish}
    />
  )
}
