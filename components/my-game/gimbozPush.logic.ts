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

function hashStringToNumber(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0)
}

function rand(seed: string, salt: string): number {
  return hashStringToNumber(seed + '-' + salt) / 2 ** 32
}

function getDeterministicSymbol(seed: string, index: number, salt: string): number {
  return hashStringToNumber(`${seed}-${index}-${salt}`) % 6
}

function getPushStrength(seed: string, dropIndex: number, pileSize: number): number {
  const base = 0.6 + rand(seed, `push-${dropIndex}`) * 0.6
  const weightBonus = Math.min(0.5, pileSize * 0.015)
  return base + weightBonus
}

function getFallProbability(positionY: number, pushStrength: number): number {
  const frontBias = positionY / 100
  return Math.min(0.95, 0.15 + frontBias * 0.6 + pushStrength * 0.25)
}

function chooseFallSlot(seed: string, tokenId: string): 0 | 1 | 2 {
  const roll = hashStringToNumber(seed + tokenId) % 100
  if (roll < 40) return 0
  if (roll < 70) return 1
  return 2
}

export function generatePusherRun({ seed, payouts, betAmount, totalDrops, selectedLane }: GeneratePusherRunParams): GimbozPushRun {
  const safeTotalDrops = Math.max(1, totalDrops)
  const betPerDrop = betAmount / safeTotalDrops

  const steps: PusherStep[] = []
  let totalPayout = 0
  let bestCascadeDepth = 0
  let anyBonusTriggered = false

  let simulatedPile: PusherToken[] = []

  for (let dropIndex = 0; dropIndex < safeTotalDrops; dropIndex += 1) {
    const reelOutcome: [number, number, number] = [
      getDeterministicSymbol(seed, dropIndex, 'a'),
      getDeterministicSymbol(seed, dropIndex, 'b'),
      getDeterministicSymbol(seed, dropIndex, 'c'),
    ]

    const payoutFactor = getPayout(payouts, reelOutcome[0], reelOutcome[1], reelOutcome[2])
    const payout = (betPerDrop * payoutFactor) / 10000

    const pushStrength = getPushStrength(seed, dropIndex, simulatedPile.length)

    // simulate push forward
    simulatedPile = simulatedPile.map((t) => ({
      ...t,
      y: Math.min(100, t.y + pushStrength * 18),
    }))

    const tokensAdded: PusherToken[] = [
      {
        id: `drop-${dropIndex}`,
        type: 'base',
        lane: selectedLane,
        value: betPerDrop,
        x: 50 + (rand(seed, `x-${dropIndex}`) - 0.5) * 20,
        y: 20,
        zIndex: dropIndex,
      },
    ]

    simulatedPile.push(...tokensAdded)

    const tokensFallen: PusherToken[] = []
    let nearMissCount = 0

    simulatedPile = simulatedPile.filter((token) => {
      const fallProb = getFallProbability(token.y, pushStrength)
      const roll = rand(seed, token.id + '-' + dropIndex)

      if (token.y > 80 && roll < fallProb) {
        tokensFallen.push({
          ...token,
          falling: true,
          fallSlot: chooseFallSlot(seed, token.id),
        })
        return false
      }

      if (token.y > 70 && roll > fallProb) {
        nearMissCount++
        token.nearMiss = true
      }

      return true
    })

    const cascadeDepth = tokensFallen.length >= 4 ? 2 : tokensFallen.length >= 2 ? 1 : 0
    bestCascadeDepth = Math.max(bestCascadeDepth, cascadeDepth)

    const bonusTriggered = cascadeDepth >= 2 ? 'gimboz-nudge' : null
    if (bonusTriggered) anyBonusTriggered = true

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
      pushStrength,
      nearMissCount,
      shakeIntensity: pushStrength,
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
