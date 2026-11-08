import type { TestComponentProps } from '../types'
import { OrderGame } from './OrderGame'
import { NUMBER_ORDER_MS, START_TILES, numberOrderTiles } from './scoring'

export default function NumberOrderTest({ onFinish }: TestComponentProps) {
  return (
    <OrderGame
      tilesFor={numberOrderTiles}
      memorizeMsFor={() => NUMBER_ORDER_MS}
      roundLabel={(r) => `Round ${r + 1}`}
      result={(cleared) => ({
        score: cleared ? numberOrderTiles(cleared - 1) : 0,
        details: { 'Rounds cleared': String(cleared), 'Failed with': `${START_TILES + cleared} tiles` },
      })}
      onFinish={onFinish}
    />
  )
}
