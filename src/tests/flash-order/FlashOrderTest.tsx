import type { TestComponentProps } from '../types'
import { fmtMs } from '../../lib/resultFormat'
import { OrderGame, type OrderRunStats } from '../number-order/OrderGame'
import { FLASH_ORDER_LIVES, START_TILES, flashOrderMs } from '../number-order/scoring'

/** Stats shared by a scored run and a run without a cleared round. */
const avgTile = ({ tileMs }: OrderRunStats) =>
  tileMs.length ? [{ label: 'Avg time per tile', value: fmtMs(tileMs.reduce((a, b) => a + b, 0) / tileMs.length) }] : []

/** Each lost life: the flash time it happened at. */
const missChips = ({ misses }: OrderRunStats) => ({
  title: 'Lives lost at',
  items: misses.map((r, i) => ({ label: `Life ${i + 1}`, value: `${flashOrderMs(r)} ms` })),
})

export default function FlashOrderTest({ onFinish }: TestComponentProps) {
  return (
    <OrderGame
      lives={FLASH_ORDER_LIVES}
      tilesFor={() => START_TILES}
      memorizeMsFor={flashOrderMs}
      roundLabel={(r) => `Round ${r + 1}`}
      roundUnit={(r) => `${flashOrderMs(r)} ms flash`}
      scoreSoFar={(cleared) => (cleared ? { value: String(flashOrderMs(cleared - 1)), unit: 'ms' } : { value: '–' })}
      result={(cleared, stats) =>
        cleared
          ? {
              score: flashOrderMs(cleared - 1),
              details: {
                stats: [
                  { label: 'Rounds cleared', value: String(cleared) },
                  { label: 'Out of lives at', value: `${flashOrderMs(cleared)} ms` },
                  ...avgTile(stats),
                ],
                chips: missChips(stats),
              },
            }
          : {
              // Lower is better and no round was cleared: there is no honest number, so no score.
              score: 0,
              failed: 'Not even the first round — try again!',
              details: { stats: [{ label: 'Out of lives at', value: `${flashOrderMs(0)} ms` }, ...avgTile(stats)] },
            }
      }
      onFinish={onFinish}
    />
  )
}
