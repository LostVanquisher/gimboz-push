'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import useSound from 'use-sound'
import { Game } from '@/lib/games'
import { DropLane, PusherPhase, PusherStep, PusherToken } from './gimbozPush.types'

interface GimbozPushWindowProps {
  game: Game
  phase: PusherPhase
  tokens: PusherToken[]
  activeStep: PusherStep | null
  selectedLane: DropLane
  currentDropIndex: number
  totalDrops: number
  gameCompleted: boolean
  betAmount: number
  payoutAmount: number
  cascadeDepth: number
  bonusActive: boolean
  isAnimating: boolean
}

const laneLeftClass: Record<DropLane, string> = {
  left: 'left-[22%]',
  center: 'left-[50%]',
  right: 'left-[78%]',
}

const GimbozPushWindow: React.FC<GimbozPushWindowProps> = ({
  game,
  activeStep,
  currentDropIndex,
  totalDrops,
  gameCompleted,
  betAmount,
  payoutAmount,
  cascadeDepth,
  bonusActive,
  isAnimating,
}) => {
  const muteSfx = false
  const sfxVolume = 0.5

  const [dropSFX] = useSound('/my-game/sfx/drop.mp3', { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true })
  const [pushSFX] = useSound('/my-game/sfx/push.mp3', { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true })
  const [fallSFX] = useSound('/my-game/sfx/fall.mp3', { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true })
  const [bonusSFX] = useSound('/my-game/sfx/bonus.mp3', { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true })

  useEffect(() => {
    if (!isAnimating || !activeStep) return

    dropSFX()
    const pushTimer = window.setTimeout(() => pushSFX(), 350)
    const fallTimer = window.setTimeout(() => {
      if (activeStep.tokensFallen.length > 0) fallSFX()
    }, 750)
    const bonusTimer = window.setTimeout(() => {
      if (activeStep.bonusTriggered) bonusSFX()
    }, 900)

    return () => {
      window.clearTimeout(pushTimer)
      window.clearTimeout(fallTimer)
      window.clearTimeout(bonusTimer)
    }
  }, [isAnimating, activeStep, dropSFX, pushSFX, fallSFX, bonusSFX])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-xl text-white">
      <div className="absolute inset-0 bg-black" />

      {game.gameBackground && (
        <Image src={game.gameBackground} alt="Gimboz Push background" fill className="object-cover opacity-70" priority />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />

      <div className="absolute left-4 top-4 z-30 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
        DROP {Math.min(currentDropIndex + 1, totalDrops)} / {totalDrops}
      </div>

      <div className="absolute right-4 top-4 z-30 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
        {payoutAmount.toFixed(3)} APE
      </div>

      {cascadeDepth > 0 && (
        <div className="absolute left-4 bottom-4 z-30 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
          CASCADE x{cascadeDepth}
        </div>
      )}

      <div className="absolute inset-x-[10%] top-[12%] bottom-[12%] z-10">
        <div className="absolute inset-x-[8%] top-[8%] h-[54%] rounded-3xl border border-white/10 bg-black/35 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-x-[12%] top-[8%] h-1 rounded-full bg-white/20" />

          <div className="absolute inset-x-[10%] top-[16%] flex justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>

          <motion.div
            className="absolute inset-x-[8%] bottom-[16%] h-[40%] rounded-2xl border border-white/10 bg-white/8"
            animate={{ y: isAnimating ? [0, 18, 0] : 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          />

          <div className="absolute inset-x-[8%] bottom-[8%] h-[8%] rounded-xl border border-white/10 bg-black/50" />

          <div className="absolute bottom-[3%] left-[12%] right-[12%] grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-white/70">
            <div className="rounded-md bg-white/10 py-1">1x</div>
            <div className="rounded-md bg-white/15 py-1">2x</div>
            <div className="rounded-md bg-white/10 py-1">1x</div>
          </div>

          {activeStep?.tokensAdded.map((token) => (
            <motion.div
              key={`active-${token.id}`}
              className={`absolute top-[4%] h-8 w-8 -translate-x-1/2 rounded-full border border-white/30 shadow-xl ${token.type === 'gimboz' ? 'bg-blue-400' : 'bg-yellow-300'} ${laneLeftClass[token.lane]}`}
              initial={{ y: -80, opacity: 0, scale: 0.8 }}
              animate={{ y: isAnimating ? [0, 120, 135] : 135, opacity: 1, scale: token.type === 'gimboz' ? 1.12 : 1 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          ))}

          {activeStep?.tokensFallen.map((token, index) => (
            <motion.div
              key={`fallen-${token.id}`}
              className="absolute bottom-[16%] h-7 w-7 -translate-x-1/2 rounded-full border border-white/20 bg-yellow-300 shadow-lg"
              style={{ left: `${32 + index * 9}%` }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: isAnimating ? [0, 70, 120] : 120, opacity: isAnimating ? [1, 1, 0] : 0 }}
              transition={{ duration: 0.8, delay: 0.45 + index * 0.05 }}
            />
          ))}
        </div>

        <motion.div
          className="absolute bottom-[6%] right-[2%] z-20 h-[34%] w-[34%]"
          animate={{ y: bonusActive ? [0, -8, 0] : 0, rotate: bonusActive ? [0, -2, 2, 0] : 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image src="/my-game/gimboz-idle.webp" alt="Gimboz" fill className="object-contain" priority />
        </motion.div>

        {bonusActive && (
          <motion.div
            className="absolute left-1/2 top-[52%] z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            Gimboz Nudge
          </motion.div>
        )}

        {gameCompleted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-center shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Final Payout</p>
              <p className="mt-2 text-4xl font-bold">{payoutAmount.toFixed(3)} APE</p>
              <p className="mt-2 text-sm text-white/50">Bet: {betAmount.toFixed(3)} APE</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GimbozPushWindow
