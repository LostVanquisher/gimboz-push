export const GIMBOZ_PUSH_CONFIG = {
  minBet: 1,
  maxBet: 100,
  minDrops: 1,
  maxDrops: 15,
  defaultDrops: 10,
  lanes: ['left', 'center', 'right'] as const,
  defaultLane: 'center' as const,
  resultModalDelayMs: 1000,
  stepAnimationMs: 1200,
}
