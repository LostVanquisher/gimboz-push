import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Game } from '@/lib/games'
import BetAmountInput from '@/components/shared/BetAmountInput'
import { CustomSlider } from '@/components/shared/CustomSlider'
import ChipSelection, { Chip } from '@/components/shared/ChipSelection'
import { DropLane } from './gimbozPush.types'
import { GIMBOZ_PUSH_CONFIG } from './gimbozPushConfig'

interface GimbozPushSetupCardProps {
  game: Game
  onPlay: () => void
  onDrop: () => void
  onRewatch: () => void
  onReset: () => void
  onPlayAgain: () => void
  playAgainText?: string
  currentView: 0 | 1 | 2
  betAmount: number
  setBetAmount: (amount: number) => void
  numberOfDrops: number
  setNumberOfDrops: (drops: number) => void
  selectedLane: DropLane
  setSelectedLane: (lane: DropLane) => void
  isLoading: boolean
  payout: number | null
  dropsLeft: number
  bestCascadeDepth: number
  bonusTriggered: boolean
  inReplayMode: boolean
  account?: { address: string }
  walletBalance: number
  playerAddress?: string
  isGamePaused?: boolean
  profile?: unknown
  minBet: number
  maxBet: number
}

const GimbozPushSetupCard: React.FC<GimbozPushSetupCardProps> = ({
  game,
  onPlay,
  onDrop,
  onRewatch,
  onReset,
  onPlayAgain,
  playAgainText = 'Play Again',
  currentView,
  betAmount,
  setBetAmount,
  numberOfDrops,
  setNumberOfDrops,
  selectedLane,
  setSelectedLane,
  isLoading,
  payout,
  dropsLeft,
  bestCascadeDepth,
  bonusTriggered,
  inReplayMode,
  account = undefined,
  playerAddress = undefined,
  walletBalance,
  isGamePaused = false,
  maxBet,
}) => {
  const themeColorBackground = game.themeColorBackground
  const usdMode = false

  const chips: Chip[] = [
    { id: '1', value: 1, image: '/shared/chips/chip_1.png' },
    { id: '5', value: 5, image: '/shared/chips/chip_5.png' },
    { id: '10', value: 10, image: '/shared/chips/chip_10.png' },
    { id: '25', value: 25, image: '/shared/chips/chip_25.png' },
  ]

  const [selectedChipId, setSelectedChipId] = React.useState<string | null>(null)

  const getCurrentWalletAmount = (): number => walletBalance
  const getCurrentWalletAmountString = (): string => `${walletBalance.toFixed(2)} APE`

  const formatApe = (amount: number): string => {
    return `${amount.toLocaleString([], { minimumFractionDigits: 0, maximumFractionDigits: 3 })} APE`
  }

  const getBetPerDrop = (): number => betAmount / Math.max(1, numberOfDrops)

  const canReplay = (): boolean => {
    if (!playerAddress) return false
    if (!account) return false
    if (inReplayMode) return false
    return playerAddress.toLowerCase() === account.address.toLowerCase()
  }

  const DropsLeftBlock = (hideOnDesktop: boolean) => (
    <div className={`${hideOnDesktop ? 'lg:hidden' : 'hidden lg:block'} text-center font-nohemia`}>
      <p className="text-lg font-medium text-[#91989C]">Drops Left</p>
      <p className="mt-2 font-semibold text-2xl sm:text-5xl" style={{ color: themeColorBackground }}>
        {dropsLeft} / {numberOfDrops}
      </p>
    </div>
  )

  const LaneSelector = () => (
    <div className="mt-8">
      <p className="mb-3 text-sm font-semibold text-foreground">Drop Lane</p>
      <div className="grid grid-cols-3 gap-2">
        {GIMBOZ_PUSH_CONFIG.lanes.map((lane) => {
          const isSelected = selectedLane === lane
          return (
            <Button
              key={lane}
              type="button"
              variant={isSelected ? 'default' : 'secondary'}
              onClick={() => setSelectedLane(lane)}
              disabled={isLoading}
              style={isSelected ? { backgroundColor: themeColorBackground, borderColor: themeColorBackground } : undefined}
              className="capitalize"
            >
              {lane}
            </Button>
          )
        })}
      </div>
    </div>
  )

  const StatsBlock = ({ includeWallet = false }: { includeWallet?: boolean }) => {
    const showGreenText = (payout || 0) > betAmount
    return (
      <div className="w-full flex flex-col items-center gap-2 font-medium text-xs text-[#91989C]">
        <div className="w-full flex justify-between items-center gap-2">
          <p>Total Buy In</p>
          <p className="text-right">{formatApe(betAmount)}</p>
        </div>
        <div className="w-full flex justify-between items-center gap-2">
          <p>Bet Per Drop</p>
          <p className="text-right">{formatApe(getBetPerDrop())}</p>
        </div>
        <div className="w-full flex justify-between items-center gap-2">
          <p>Total Payout</p>
          <p className={`text-right ${showGreenText ? 'text-success' : ''}`}>{formatApe(payout || 0)}</p>
        </div>
        <div className="w-full flex justify-between items-center gap-2">
          <p>Best Cascade</p>
          <p className="text-right">x{bestCascadeDepth}</p>
        </div>
        <div className="w-full flex justify-between items-center gap-2">
          <p>Gimboz Nudge</p>
          <p className="text-right">{bonusTriggered ? 'Triggered' : '—'}</p>
        </div>
        {includeWallet && (
          <div className="w-full flex justify-between items-center gap-2">
            <p>Wallet Balance</p>
            <p className="text-right">{getCurrentWalletAmountString()}</p>
          </div>
        )}
      </div>
    )
  }

  const ShowInUsdAndStats = (invertOnDesktop: boolean) => (
    <div className={`${invertOnDesktop ? 'flex-col-reverse lg:flex-col' : 'flex-col'} font-roboto flex gap-12 lg:gap-8`}>
      {inReplayMode && (
        <p className="mt-2 font-semibold text-3xl sm:text-3xl text-center" style={{ color: themeColorBackground }}>
          Replay Mode
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-foreground text-lg font-semibold">Show Bets in USD</p>
          <p className="text-sm">Your bets are valued in {usdMode ? 'US Dollars' : 'APE'}</p>
        </div>
        <Switch checked={usdMode} onCheckedChange={() => {}} aria-readonly />
      </div>
      <StatsBlock />
    </div>
  )

  return (
    <Card className="lg:basis-1/3 p-6 flex flex-col">
      {currentView === 0 && (
        <>
          <CardContent className="font-roboto">
            <Button
              onClick={onPlay}
              className="lg:hidden w-full"
              style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }}
              disabled={betAmount <= 0 || isGamePaused}
            >
              Place Your Bet
            </Button>

            <div className="mt-5">
              <BetAmountInput
                min={GIMBOZ_PUSH_CONFIG.minBet}
                max={getCurrentWalletAmount()}
                step={0.1}
                value={betAmount}
                onChange={setBetAmount}
                balance={getCurrentWalletAmount()}
                usdMode={usdMode}
                setUsdMode={() => {}}
                disabled={isLoading}
                themeColorBackground={themeColorBackground}
              />
            </div>

            <ChipSelection
              chips={chips}
              selectedChipId={selectedChipId}
              onChipSelect={(chip) => {
                setSelectedChipId(chip.id)
                setBetAmount(chip.value)
              }}
              onRemoveAllBets={() => {
                setSelectedChipId(null)
                setBetAmount(0)
              }}
            />

            <div className="mt-8">
              <CustomSlider
                label="Number of Drops"
                min={GIMBOZ_PUSH_CONFIG.minDrops}
                max={GIMBOZ_PUSH_CONFIG.maxDrops}
                step={1}
                value={numberOfDrops}
                onChange={setNumberOfDrops}
                presets={[5, 10, 15]}
                themeColor={themeColorBackground}
              />
            </div>

            <LaneSelector />
          </CardContent>

          <div className="grow" />

          <CardFooter className="mt-8 w-full flex flex-col font-roboto">
            <StatsBlock />
            <div className="w-full flex justify-between items-center gap-2 mt-3 font-medium text-xs text-[#91989C]">
              <p>Max Bet Per Game</p>
              <p className="text-right">{maxBet.toLocaleString([], { maximumFractionDigits: 0 })} APE</p>
            </div>
            <Button
              onClick={onPlay}
              className="hidden lg:flex mt-6 w-full"
              style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }}
              disabled={betAmount <= 0 || isGamePaused}
            >
              Place Your Bet
            </Button>
          </CardFooter>
        </>
      )}

      {currentView === 1 && (
        <CardContent className="grow font-roboto flex flex-col-reverse lg:flex-col lg:justify-between gap-8">
          {ShowInUsdAndStats(true)}
          {DropsLeftBlock(false)}
          <div className="flex lg:flex-col justify-evenly items-center">
            {DropsLeftBlock(true)}
            <div className="font-roboto flex flex-col items-center gap-3 w-full">
              <Button
                onClick={onDrop}
                className="w-full min-h-[84px] text-xl font-bold tracking-wide"
                style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }}
                disabled={dropsLeft <= 0 || isGamePaused}
              >
                Drop Token
              </Button>
              <p className="text-xs text-[#91989C]">Push the pile. Feed the edge.</p>
            </div>
          </div>
        </CardContent>
      )}

      {currentView === 2 && (
        <CardContent className="grow font-roboto flex flex-col lg:justify-between gap-8">
          <div className="lg:hidden">
            {canReplay() ? (
              <Button className="w-full" style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }} onClick={onPlayAgain} disabled={isGamePaused}>
                {playAgainText}
              </Button>
            ) : (
              <Button className="w-full" variant="secondary" style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }} onClick={onRewatch}>
                Rewatch Push
              </Button>
            )}
            <Button className="w-full mt-3" variant="secondary" onClick={onReset}>Change Bet</Button>
          </div>

          <div className="font-roboto flex flex-col gap-12 lg:gap-8">
            {inReplayMode && (
              <p className="mt-2 font-semibold text-3xl sm:text-3xl text-center" style={{ color: themeColorBackground }}>
                Replay Mode
              </p>
            )}
            <StatsBlock includeWallet />
          </div>

          {DropsLeftBlock(false)}

          <CardFooter className="w-full hidden lg:block">
            <div className="w-full flex flex-col gap-4">
              {canReplay() ? (
                <Button className="w-full" style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }} onClick={onPlayAgain} disabled={isGamePaused}>
                  {playAgainText}
                </Button>
              ) : (
                <Button className="w-full" style={{ backgroundColor: themeColorBackground, borderColor: themeColorBackground }} onClick={onRewatch}>
                  Rewatch Push
                </Button>
              )}
              <Button className="w-full" variant="secondary" onClick={onReset}>Change Bet</Button>
            </div>
          </CardFooter>
        </CardContent>
      )}
    </Card>
  )
}

export default GimbozPushSetupCard
