import { getPayout } from '@/lib/games'
import { DropLane, GimbozPushRun, GimbozPushState, PusherStep, PusherToken } from './gimbozPush.types'

type PayoutTable = Parameters<typeof getPayout>[0]

interface GeneratePusherRunParams {
  seed: string
  payouts: PayoutTable
  betAmount: number
  totalDrops: number
  selectedLane: DropLane
}

const laneXMap: Record<DropLane, number> = {
  left: 22,
  center: 50,
  right: 78,
}

function hashStringToNumber(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0)
}

function getDeterministicSymbol(seed: string, index: number, salt: string): number {
  return hashStringToNumber(`${seed}-${index}-${salt}`) % 6
}

function createToken(params: {
  id: string
  lane: DropLane
  value: number
  dropIndex: number
  type?: 'base' | 'gimboz'
  falling?: boolean
}): PusherToken {
  const laneBaseX = laneXMap[params.lane]
  const jitter = ((hashStringToNumber(params.id) % 11) - 5) * 0.8

  return {
    id: params.id,
    type: params.type ?? 'base',
    lane: params.lane,
    value: params.value,
    x: laneBaseX + jitter,
    y: 18 + (params.dropIndex % 7) * 6,
    zIndex: params.dropIndex,
    falling: params.falling ?? false,
  }
}

function getFallenTokenCountFromPayoutFactor(payoutFactor: number): number {
  if (payoutFactor <= 0) return 0
  if (payoutFactor >= 500000) return 5
  if (payoutFactor >= 250000) return 4
  if (payoutFactor >= 100000) return 3
  if (payoutFactor >= 50000) return 2
  return 1
}

function shouldTriggerGimbozNudge(params: {
  seed: string
  dropIndex: number
  cascadeDepth: number
  payoutFactor: number
}): boolean {
  if (params.cascadeDepth >= 2 && params.payoutFactor > 0) return true
  const roll = hashStringToNumber(`${params.seed}-${params.dropIndex}-gimboz-nudge`) % 100
  return roll >= 92
}

export function generatePusherRun({ seed, payouts, betAmount, totalDrops, selectedLane }: GeneratePusherRunParams): GimbozPushRun {
  const safeTotalDrops = Math.max(1, totalDrops)
  const betPerDrop = betAmount / safeTotalDrops

  const steps: PusherStep[] = []
  let totalPayout = 0
  let bestCascadeDepth = 0
  let anyBonusTriggered = false

  for (let dropIndex = 0; dropIndex < safeTotalDrops; dropIndex += 1) {
    const reelOutcome: [number, number, number] = [
      getDeterministicSymbol(seed, dropIndex, 'a'),
      getDeterministicSymbol(seed, dropIndex, 'b'),
      getDeterministicSymbol(seed, dropIndex, 'c'),
    ]

    const payoutFactor = getPayout(payouts, reelOutcome[0], reelOutcome[1], reelOutcome[2])
    const payout = (betPerDrop * payoutFactor) / 10000
    const fallenTokenCount = getFallenTokenCountFromPayoutFactor(payoutFactor)

    const cascadeDepth = fallenTokenCount >= 5 ? 2 : fallenTokenCount >= 3 ? 1 : 0
    bestCascadeDepth = Math.max(bestCascadeDepth, cascadeDepth)

    const bonusTriggered = shouldTriggerGimbozNudge({ seed, dropIndex, cascadeDepth, payoutFactor }) ? 'gimboz-nudge' : null
    if (bonusTriggered) anyBonusTriggered = true

    const tokensAdded = [
      createToken({
        id: `drop-${dropIndex}-token-0`,
        lane: selectedLane,
        value: betPerDrop,
        dropIndex,
        type: bonusTriggered ? 'gimboz' : 'base',
      }),
    ]

    const tokensFallen = Array.from({ length: fallenTokenCount }).map((_, i) =>
      createToken({
        id: `drop-${dropIndex}-fallen-${i}`,
        lane: selectedLane,
        value: payout / Math.max(1, fallenTokenCount),
        dropIndex,
        falling: true,
      })
    )

    const step: PusherStep = {
      id: `step-${dropIndex}`,
      dropIndex,
      phase: bonusTriggered ? 'bonus' : cascadeDepth > 0 ? 'cascade' : 'push',
      lane: selectedLane,
      reelOutcome,
      tokensAdded,
      tokensFallen,
      payout,
      cascadeDepth,
      bonusTriggered,
    }

    totalPayout += payout
    steps.push(step)
  }

  return {
    seed,
    betAmount,
    betPerDrop,
    totalDrops: safeTotalDrops,
    selectedLane,
    steps,
    totalPayout,
    bestCascadeDepth,
    bonusTriggered: anyBonusTriggered,
  }
}

export function getInitialGimbozPushState(selectedLane: DropLane = 'center', totalDrops = 10): GimbozPushState {
  return {
    selectedLane,
    currentDropIndex: 0,
    totalDrops,
    boardTokens: [],
    activeStep: null,
    resolvedSteps: [],
    payout: 0,
    isAnimating: false,
    gameOver: false,
    bonusActive: false,
    bestCascadeDepth: 0,
  }
}
