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

const laneDropX: Record<DropLane, number> = {
  left: 34,
  center: 50,
  right: 66,
}

const formatApe = (amount: number): string => amount.toFixed(3)

const GimbozPushWindow: React.FC<GimbozPushWindowProps> = ({
  game,
  tokens,
  activeStep,
  selectedLane,
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
    const pushTimer = window.setTimeout(() => pushSFX(), 360)
    const fallTimer = window.setTimeout(() => {
      if (activeStep.tokensFallen.length > 0) fallSFX()
    }, 820)
    const bonusTimer = window.setTimeout(() => {
      if (activeStep.bonusTriggered) bonusSFX()
    }, 920)

    return () => {
      window.clearTimeout(pushTimer)
      window.clearTimeout(fallTimer)
      window.clearTimeout(bonusTimer)
    }
  }, [isAnimating, activeStep, dropSFX, pushSFX, fallSFX, bonusSFX])

  const activeDropX = activeStep ? laneDropX[activeStep.lane] : laneDropX[selectedLane]
  const activeFalls = activeStep?.tokensFallen ?? []
  const visiblePile = [...tokens].slice(-36)

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-xl text-white">
      <div className="absolute inset-0 bg-[#050608]" />

      {game.gameBackground && (
        <Image src={game.gameBackground} alt="Gimboz Push background" fill className="object-cover opacity-45" priority />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />

      <div className="absolute left-4 top-4 z-30 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold backdrop-blur">
        DROP {Math.min(currentDropIndex + 1, totalDrops)} / {totalDrops}
      </div>

      <div className="absolute right-4 top-4 z-30 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold backdrop-blur">
        {formatApe(payoutAmount)} APE
      </div>

      <div className="absolute inset-x-[8%] top-[11%] bottom-[8%] z-10">
        <div className="absolute inset-x-[7%] top-[2%] bottom-[4%] rounded-[2rem] border border-white/10 bg-black/45 shadow-2xl backdrop-blur-sm">
          <div className="absolute left-1/2 top-[4%] h-[14%] w-[26%] -translate-x-1/2 rounded-b-3xl border border-white/10 bg-white/10 shadow-inner">
            <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/50" />
            <div className="absolute bottom-2 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-white/25" />
          </div>

          <div className="absolute left-[10%] right-[10%] top-[20%] h-[16%] rounded-2xl border border-white/10 bg-white/8 shadow-inner">
            <div className="absolute inset-x-6 top-3 text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">
              Drop shelf
            </div>
            <motion.div
              className="absolute top-[44%] h-8 w-8 -translate-x-1/2 rounded-full border border-white/25 bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.35)]"
              style={{ left: `${activeDropX}%` }}
              initial={false}
              animate={{ y: isAnimating ? [-78, 0, 7] : 7, opacity: isAnimating ? [0, 1, 1] : 0, scale: activeStep?.bonusTriggered ? 1.12 : 1 }}
              transition={{ duration: 0.48, ease: 'easeOut' }}
            />
          </div>

          <motion.div
            className="absolute left-[12%] right-[12%] top-[37%] h-[20%] rounded-2xl border border-white/12 bg-gradient-to-b from-white/16 to-white/5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
            animate={{ y: isAnimating ? [0, 20, 0] : 0, scaleY: bonusActive ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 0.78, ease: 'easeInOut' }}
          >
            <div className="absolute left-1/2 top-3 h-1 w-24 -translate-x-1/2 rounded-full bg-white/25" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.24em] text-white/35">Pusher plate</div>
          </motion.div>

          <div className="absolute left-[10%] right-[10%] top-[54%] h-[25%] rounded-2xl border border-white/10 bg-black/35 shadow-inner overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 to-transparent" />
            <div className="absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Coin field</div>

            {visiblePile.map((token, index) => {
              const row = Math.floor(index / 9)
              const col = index % 9
              const left = 12 + col * 9.5 + ((index % 2) * 2)
              const top = 58 - row * 12
              return (
                <motion.div
                  key={token.id}
                  className={`absolute h-7 w-7 rounded-full border border-white/20 shadow-lg ${token.type === 'gimboz' ? 'bg-blue-400' : 'bg-yellow-300'}`}
                  style={{ left: `${left}%`, top: `${top}%`, zIndex: index }}
                  initial={{ y: -24, opacity: 0, scale: 0.8 }}
                  animate={{ y: isAnimating ? [0, 10, 16] : 0, opacity: 1, scale: token.type === 'gimboz' ? 1.08 : 1 }}
                  transition={{ duration: 0.75, ease: 'easeInOut' }}
                />
              )
            })}

            {isAnimating && activeFalls.length === 0 && activeStep && (
              <motion.div
                className="absolute left-1/2 top-[54%] -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 0], y: [10, 0, -6] }}
                transition={{ duration: 0.9, delay: 0.35 }}
              >
                Stack holds
              </motion.div>
            )}
          </div>

          <div className="absolute left-[10%] right-[10%] top-[79%] h-[11%] rounded-b-3xl border border-white/10 bg-black/70 shadow-inner">
            <div className="absolute left-1/2 top-0 h-[2px] w-[88%] -translate-x-1/2 bg-white/30" />
            <div className="absolute inset-x-4 bottom-3 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-white/70">
              <div className="rounded-md bg-white/10 py-1">1x</div>
              <div className="rounded-md bg-white/15 py-1">2x</div>
              <div className="rounded-md bg-white/10 py-1">1x</div>
            </div>

            {activeFalls.map((token, index) => (
              <motion.div
                key={`fall-${token.id}`}
                className="absolute top-[-52%] h-7 w-7 rounded-full border border-white/20 bg-yellow-300 shadow-lg"
                style={{ left: `${26 + index * 12}%` }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: isAnimating ? [0, 46, 72] : 72, opacity: isAnimating ? [0, 1, 0] : 0 }}
                transition={{ duration: 0.82, delay: 0.56 + index * 0.06 }}
              />
            ))}
          </div>

          {cascadeDepth > 0 && (
            <motion.div
              className="absolute left-1/2 top-[48%] z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Cascade x{cascadeDepth}
            </motion.div>
          )}

          {bonusActive && (
            <motion.div
              className="absolute left-1/2 top-[31%] z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              Gimboz Nudge
            </motion.div>
          )}
        </div>

        <motion.div
          className="absolute bottom-[0%] right-[0%] z-20 h-[32%] w-[32%]"
          animate={{ y: bonusActive ? [0, -8, 0] : 0, rotate: bonusActive ? [0, -2, 2, 0] : 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image src="/my-game/gimboz-idle.webp" alt="Gimboz" fill className="object-contain" priority />
        </motion.div>

        {gameCompleted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-center shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Final Payout</p>
              <p className="mt-2 text-4xl font-bold">{formatApe(payoutAmount)} APE</p>
              <p className="mt-2 text-sm text-white/50">Bet: {formatApe(betAmount)} APE</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GimbozPushWindow
