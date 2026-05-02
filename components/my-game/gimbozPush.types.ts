export type DropLane = 'left' | 'center' | 'right'

export type TokenType = 'base' | 'gimboz'

export type PusherPhase =
  | 'idle'
  | 'drop'
  | 'settle'
  | 'push'
  | 'fall'
  | 'cascade'
  | 'bonus'
  | 'complete'

export type BonusType = 'gimboz-nudge' | null

export interface PusherToken {
  id: string
  type: TokenType
  lane: DropLane
  value: number
  x: number
  y: number
  zIndex: number
  falling?: boolean
  pushX?: number
  pushY?: number
  fallSlot?: 0 | 1 | 2
  nearMiss?: boolean
}

export interface PusherStep {
  id: string
  dropIndex: number
  phase: PusherPhase
  lane: DropLane
  reelOutcome: [number, number, number]
  tokensAdded: PusherToken[]
  tokensFallen: PusherToken[]
  payout: number
  cascadeDepth: number
  bonusTriggered: BonusType
  pushStrength: number
  nearMissCount: number
  shakeIntensity: number
}

export interface GimbozPushRun {
  seed: string
  betAmount: number
  betPerDrop: number
  totalDrops: number
  selectedLane: DropLane
  steps: PusherStep[]
  totalPayout: number
  bestCascadeDepth: number
  bonusTriggered: boolean
}

export interface GimbozPushState {
  selectedLane: DropLane
  currentDropIndex: number
  totalDrops: number
  boardTokens: PusherToken[]
  activeStep: PusherStep | null
  resolvedSteps: PusherStep[]
  payout: number
  isAnimating: boolean
  gameOver: boolean
  bonusActive: boolean
  bestCascadeDepth: number
}
