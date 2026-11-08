import type { TestComponentProps } from '../types'
import { OrderGame } from '../number-order/OrderGame'
import { START_TILES, flashOrderMs } from '../number-order/scoring'

export default function FlashOrderTest({ onFinish }: TestComponentProps) {
  return (
    <OrderGame
      tilesFor={() => START_TILES}
      memorizeMsFor={flashOrderMs}
      roundLabel={(r) => `Round ${r + 1}`}
      result={(cleared) =>
        cleared
          ? {
              score: flashOrderMs(cleared - 1),
              details: { 'Rounds cleared': String(cleared), 'Failed at': `${flashOrderMs(cleared)} ms` },
            }
          : { score: 0, failed: 'Not even the first round — try again!' }
      }
      onFinish={onFinish}
    />
  )
}
