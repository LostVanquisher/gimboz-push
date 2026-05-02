'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { bytesToHex, Hex } from 'viem'
import { toast } from 'sonner'
import { Game, randomBytes } from '@/lib/games'
import GameWindow from '@/components/shared/GameWindow'
import GimbozPushWindow from './GimbozPushWindow'
import GimbozPushSetupCard from './GimbozPushSetupCard'
import { DropLane, GimbozPushRun, GimbozPushState } from './gimbozPush.types'
import { generatePusherRun, getInitialGimbozPushState } from './gimbozPush.logic'
import { GIMBOZ_PUSH_CONFIG } from './gimbozPushConfig'

interface GimbozPushProps {
  game: Game
}

const GimbozPush: React.FC<GimbozPushProps> = ({ game }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const replayIdString = searchParams.get('id')
  const walletBalance = 25

  const [currentView, setCurrentView] = React.useState<0 | 1 | 2>(0)
  const [isGameOngoing, setIsGameOngoing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const [betAmount, setBetAmount] = React.useState(0)
  const [numberOfDrops, setNumberOfDrops] = React.useState(GIMBOZ_PUSH_CONFIG.defaultDrops)
  const [selectedLane, setSelectedLane] = React.useState<DropLane>(GIMBOZ_PUSH_CONFIG.defaultLane)

  const [run, setRun] = React.useState<GimbozPushRun | null>(null)
  const [gameState, setGameState] = React.useState<GimbozPushState>(
    getInitialGimbozPushState(selectedLane, numberOfDrops)
  )

  const [currentGameId, setCurrentGameId] = useState<bigint>(
    replayIdString == null ? BigInt(bytesToHex(new Uint8Array(randomBytes(32)))) : BigInt(replayIdString)
  )
  const [userRandomWord, setUserRandomWord] = useState<Hex>(bytesToHex(new Uint8Array(randomBytes(32))))

  const payout = gameState.payout
  const gameOver = gameState.gameOver
  const shouldShowPNL = payout > betAmount
  const playAgainText = `Play Again (${numberOfDrops} More Drops)`

  const getSeed = (gameId: bigint, randomWord: Hex): string => `${gameId.toString()}-${randomWord}`

  useEffect(() => {
    if (replayIdString !== null && replayIdString.length > 2) {
      const replayGameId = BigInt(replayIdString)
      const replayRun = generatePusherRun({
        seed: getSeed(replayGameId, userRandomWord),
        payouts: game.payouts,
        betAmount: Math.max(betAmount, GIMBOZ_PUSH_CONFIG.minBet),
        totalDrops: numberOfDrops,
        selectedLane,
      })

      setCurrentGameId(replayGameId)
      setRun(replayRun)
      setGameState({
        ...getInitialGimbozPushState(selectedLane, numberOfDrops),
        resolvedSteps: replayRun.steps,
        totalDrops: replayRun.totalDrops,
      })

      setIsLoading(false)
      setCurrentView(1)
    }
  }, [replayIdString])

  useEffect(() => {
    if (!gameState.gameOver) return
    const timer = window.setTimeout(() => {
      setCurrentView(2)
      setIsGameOngoing(false)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [gameState.gameOver])

  const getDropsLeft = (): number => Math.max(0, numberOfDrops - gameState.currentDropIndex)
  const getActiveBetAmount = (): number => betAmount

  const buildRun = (gameId: bigint, randomWord: Hex): GimbozPushRun => {
    return generatePusherRun({
      seed: getSeed(gameId, randomWord),
      payouts: game.payouts,
      betAmount,
      totalDrops: numberOfDrops,
      selectedLane,
    })
  }

  const playGame = async (gameId?: bigint, randomWord?: Hex) => {
    if (betAmount < GIMBOZ_PUSH_CONFIG.minBet) {
      toast.error(`Minimum bet is ${GIMBOZ_PUSH_CONFIG.minBet} APE.`)
      return
    }

    setIsLoading(true)
    setIsGameOngoing(true)

    const gameIdToUse = gameId ?? currentGameId
    const randomWordToUse = randomWord ?? userRandomWord

    try {
      const nextRun = buildRun(gameIdToUse, randomWordToUse)
      setRun(nextRun)
      setGameState({
        ...getInitialGimbozPushState(selectedLane, numberOfDrops),
        resolvedSteps: nextRun.steps,
        totalDrops: nextRun.totalDrops,
      })

      toast.success('Transaction complete!')
      setTimeout(() => {
        setIsLoading(false)
        setCurrentView(1)
      }, 1000)
    } catch (error) {
      console.error(error)
      toast.error('An unexpected error occurred.')
      setIsLoading(false)
      setIsGameOngoing(false)
    }
  }

  const handleStateAdvance = () => {
    if (gameState.isAnimating || !run || gameState.gameOver) return

    const nextStep = run.steps[gameState.currentDropIndex]
    if (!nextStep) {
      setGameState((prev) => ({ ...prev, gameOver: true, isAnimating: false, activeStep: null }))
      return
    }

    setGameState((prev) => ({
      ...prev,
      isAnimating: true,
      activeStep: nextStep,
      bonusActive: nextStep.bonusTriggered === 'gimboz-nudge',
    }))

    window.setTimeout(() => {
      setGameState((prev) => {
        const nextDropIndex = prev.currentDropIndex + 1
        const nextPayout = prev.payout + nextStep.payout
        const isComplete = nextDropIndex >= run.steps.length
        const fallenIds = new Set(nextStep.tokensFallen.map((token) => token.id))
        const nextBoardTokens = [...prev.boardTokens, ...nextStep.tokensAdded].filter((token) => !fallenIds.has(token.id))

        return {
          ...prev,
          boardTokens: nextBoardTokens,
          currentDropIndex: nextDropIndex,
          payout: nextPayout,
          isAnimating: false,
          activeStep: nextStep,
          bonusActive: false,
          bestCascadeDepth: Math.max(prev.bestCascadeDepth, nextStep.cascadeDepth),
          gameOver: isComplete,
        }
      })
    }, GIMBOZ_PUSH_CONFIG.stepAnimationMs)
  }

  const handleReset = (isPlayingAgain = false) => {
    if (!isPlayingAgain) {
      const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))))
      const newUserWord = bytesToHex(new Uint8Array(randomBytes(32)))
      setCurrentGameId(newGameId)
      setUserRandomWord(newUserWord)
    }

    setRun(null)
    setCurrentView(0)
    setIsGameOngoing(false)
    setIsLoading(false)
    setGameState(getInitialGimbozPushState(selectedLane, numberOfDrops))

    if (replayIdString !== null) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('id')
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  const handlePlayAgain = async () => {
    const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))))
    const newUserWord = bytesToHex(new Uint8Array(randomBytes(32)))
    setCurrentGameId(newGameId)
    setUserRandomWord(newUserWord)
    handleReset(true)
    await playGame(newGameId, newUserWord)
  }

  const handleRewatch = () => {
    if (!run) return
    setCurrentView(1)
    setIsGameOngoing(false)
    setGameState({
      ...getInitialGimbozPushState(run.selectedLane, run.totalDrops),
      resolvedSteps: run.steps,
      totalDrops: run.totalDrops,
    })
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-10">
        <GameWindow
          game={game}
          currentGameId={currentGameId}
          isLoading={isLoading}
          isGameFinished={gameOver}
          onPlayAgain={handlePlayAgain}
          playAgainText={playAgainText}
          onRewatch={handleRewatch}
          onReset={() => handleReset(false)}
          betAmount={getActiveBetAmount()}
          payout={payout}
          inReplayMode={replayIdString !== null}
          isUserOriginalPlayer={true}
          showPNL={shouldShowPNL}
          isGamePaused={false}
          resultModalDelayMs={GIMBOZ_PUSH_CONFIG.resultModalDelayMs}
        >
          <GimbozPushWindow
            game={game}
            phase={gameState.activeStep?.phase ?? 'idle'}
            tokens={gameState.boardTokens}
            activeStep={gameState.activeStep}
            selectedLane={selectedLane}
            currentDropIndex={gameState.currentDropIndex}
            totalDrops={numberOfDrops}
            gameCompleted={gameOver}
            betAmount={getActiveBetAmount()}
            payoutAmount={payout}
            cascadeDepth={gameState.bestCascadeDepth}
            bonusActive={gameState.bonusActive}
            isAnimating={gameState.isAnimating}
          />
        </GameWindow>

        <GimbozPushSetupCard
          game={game}
          onPlay={async () => await playGame()}
          onDrop={handleStateAdvance}
          onRewatch={handleRewatch}
          onReset={() => handleReset(false)}
          onPlayAgain={async () => await handlePlayAgain()}
          playAgainText={playAgainText}
          currentView={currentView}
          betAmount={currentView === 0 ? betAmount : getActiveBetAmount()}
          setBetAmount={setBetAmount}
          numberOfDrops={numberOfDrops}
          setNumberOfDrops={setNumberOfDrops}
          selectedLane={selectedLane}
          setSelectedLane={setSelectedLane}
          isLoading={isLoading}
          payout={payout}
          dropsLeft={getDropsLeft()}
          bestCascadeDepth={gameState.bestCascadeDepth}
          bonusTriggered={run?.bonusTriggered ?? false}
          inReplayMode={replayIdString !== null}
          account={undefined}
          walletBalance={walletBalance}
          playerAddress={undefined}
          isGamePaused={false}
          profile={undefined}
          minBet={GIMBOZ_PUSH_CONFIG.minBet}
          maxBet={GIMBOZ_PUSH_CONFIG.maxBet}
        />
      </div>
    </div>
  )
}

export default GimbozPush
