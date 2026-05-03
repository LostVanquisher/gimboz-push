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

const slotX: Record<0 | 1 | 2, number> = {
  0: 24,
  1: 50,
  2: 76,
}

const formatApe = (amount: number): string => amount.toFixed(3)

function hashStringToNumber(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0)
}

function jitterFromId(id: string, salt: string, spread: number): number {
  const raw = hashStringToNumber(`${id}-${salt}`) % 1000
  return ((raw / 1000) - 0.5) * spread
}

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
    }, 940)
    const bonusTimer = window.setTimeout(() => {
      if (activeStep.bonusTriggered) bonusSFX()
    }, 1040)

    return () => {
      window.clearTimeout(pushTimer)
      window.clearTimeout(fallTimer)
      window.clearTimeout(bonusTimer)
    }
  }, [isAnimating, activeStep, dropSFX, pushSFX, fallSFX, bonusSFX])

  const activeDropX = activeStep ? laneDropX[activeStep.lane] : laneDropX[selectedLane]
  const activeFalls = activeStep?.tokensFallen ?? []
  const visiblePile = [...tokens].slice(-44)
  const pushStrength = activeStep?.pushStrength ?? 0.75
  const nearMissCount = activeStep?.nearMissCount ?? 0
  const shakeIntensity = Math.min(8, Math.max(2, (activeStep?.shakeIntensity ?? 0.6) * 5))
  const hasFalls = activeFalls.length > 0

  const tokenClass = (token: PusherToken, nearEdge: boolean) => {
    if (token.type === 'gimboz') {
      return 'border-[#D9F7FF]/50 bg-[radial-gradient(circle_at_38%_35%,#7DE3FF_0%,#1E6BFF_45%,#0B1A2A_100%)] shadow-blue-400/30'
    }

    if (nearEdge) {
      return 'border-[#FFE8A8]/70 bg-[radial-gradient(circle_at_34%_30%,#FFF5C7_0%,#C99635_34%,#1E4FFF_58%,#0A1D4A_100%)] shadow-[#F8C65A]/45'
    }

    return 'border-[#F2C46D]/55 bg-[radial-gradient(circle_at_34%_30%,#FFE7A6_0%,#B8793E_32%,#1E4FFF_56%,#06142F_100%)] shadow-black/45'
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-xl text-white">
      <motion.div
        className="absolute inset-0"
        animate={{ x: isAnimating && (bonusActive || cascadeDepth > 0) ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity / 2, 0] : 0 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-[#050608]" />

        {game.gameBackground && (
          <Image src={game.gameBackground} alt="Wild Push background" fill className="object-cover opacity-34" priority />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(184,121,62,0.28),transparent_31%),radial-gradient(circle_at_88%_62%,rgba(35,80,42,0.24),transparent_25%),linear-gradient(to_bottom,rgba(4,8,5,0.16),rgba(0,0,0,0.8))]" />
      </motion.div>

      <div className="absolute left-4 top-4 z-30 rounded-full border border-[#B8793E]/30 bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur">
        TOKEN {Math.min(currentDropIndex + 1, totalDrops)} / {totalDrops}
      </div>

      <div className="absolute right-4 top-4 z-30 rounded-full border border-[#B8793E]/30 bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur">
        {formatApe(payoutAmount)} APE
      </div>

      <div className="absolute inset-x-[8%] top-[10%] bottom-[7%] z-10">
        <div className="absolute inset-x-[7%] top-[2%] bottom-[4%] rounded-[2rem] border border-[#B8793E]/24 bg-[linear-gradient(180deg,rgba(35,24,14,0.78),rgba(4,6,5,0.88))] shadow-2xl backdrop-blur-sm">
          <div className="absolute left-1/2 top-[4%] h-[14%] w-[26%] -translate-x-1/2 rounded-b-3xl border border-[#DDBB78]/20 bg-[linear-gradient(180deg,rgba(184,121,62,0.28),rgba(18,12,7,0.62))] shadow-inner">
            <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#E8D6B3]/70" />
            <div className="absolute bottom-2 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-[#DDBB78]/30" />
          </div>

          <div className="absolute left-[10%] right-[10%] top-[20%] h-[15%] rounded-2xl border border-[#DDBB78]/18 bg-[linear-gradient(180deg,rgba(92,62,34,0.26),rgba(14,20,14,0.48))] shadow-inner">
            <div className="absolute inset-x-6 top-3 text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-[#E8D6B3]/58">
              Wild&apos;s Shelf
            </div>
            <motion.div
              className="absolute top-[42%] h-8 w-8 -translate-x-1/2 rounded-full border border-[#F4D78C]/70 bg-[radial-gradient(circle_at_35%_30%,#FFF1B8_0%,#C58B31_32%,#1E4FFF_60%,#06142F_100%)] shadow-[0_0_24px_rgba(248,198,90,0.45)]"
              style={{ left: `${activeDropX}%` }}
              initial={false}
              animate={{ y: isAnimating ? [-84, 0, 9] : 9, opacity: isAnimating ? [0, 1, 1] : 0, scale: activeStep?.bonusTriggered ? 1.16 : 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <motion.div
            className="absolute left-[12%] right-[12%] top-[36%] h-[21%] rounded-2xl border border-[#DDBB78]/20 bg-[linear-gradient(180deg,rgba(184,121,62,0.22),rgba(24,31,21,0.18))] shadow-[0_18px_45px_rgba(0,0,0,0.42)]"
            animate={{
              y: isAnimating ? [0, -5, 22, 0] : 0,
              scaleY: bonusActive ? [1, 1.08, 1] : isAnimating ? [1, 0.97, 1.02, 1] : 1,
            }}
            transition={{ duration: 0.86, ease: 'easeInOut' }}
          >
            <div className="absolute left-1/2 top-3 h-1 w-24 -translate-x-1/2 rounded-full bg-[#DDBB78]/32" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.24em] text-[#E8D6B3]/48">Wild&apos;s Pusher</div>
          </motion.div>

          <div className="absolute left-[9%] right-[9%] top-[53%] h-[27%] rounded-2xl border border-[#DDBB78]/18 bg-[linear-gradient(180deg,rgba(8,12,9,0.42),rgba(0,0,0,0.62))] shadow-inner overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#B8793E]/18 to-transparent" />
            <div className="absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E8D6B3]/44">Wild&apos;s Edge</div>
            <div className="absolute inset-x-2 bottom-0 h-8 bg-gradient-to-t from-black/74 to-transparent pointer-events-none" />

            {visiblePile.map((token, index) => {
              const logicX = Math.max(8, Math.min(86, token.x + jitterFromId(token.id, 'x', 11)))
              const logicY = Math.max(14, Math.min(78, 18 + token.y * 0.56 + jitterFromId(token.id, 'y', 10)))
              const nearEdge = token.y > 70 || token.nearMiss
              const isRecent = index >= visiblePile.length - 3
              const size = nearEdge ? 'h-8 w-8' : 'h-7 w-7'

              return (
                <motion.div
                  key={token.id}
                  className={`absolute ${size} rounded-[48%_52%_45%_55%] border shadow-lg ${tokenClass(token, nearEdge)}`}
                  style={{ left: `${logicX}%`, top: `${logicY}%`, zIndex: Math.floor(logicY) + index }}
                  initial={{ y: -28, opacity: 0, scale: 0.8 }}
                  animate={{
                    x: isAnimating ? [0, -pushStrength * 5, pushStrength * 7, pushStrength * 2] : nearEdge ? [0, -2, 2, -1, 0] : 0,
                    y: isAnimating ? [0, -4, pushStrength * 10, pushStrength * 16] : 0,
                    opacity: 1,
                    scale: token.type === 'gimboz' ? 1.1 : nearEdge ? [1, 1.06, 1] : isRecent ? 1.04 : 1,
                    rotate: isAnimating ? [0, -8, 9, -4, 0] : nearEdge ? [0, -3, 3, 0] : 0,
                  }}
                  transition={{ duration: nearEdge ? 0.9 : 0.76, ease: 'easeInOut' }}
                >
                  <div className="absolute inset-[23%] rounded-full bg-white/80 opacity-80" />
                  <div className="absolute inset-[34%] rounded-full bg-[#1E4FFF]/70" />
                </motion.div>
              )
            })}

            {isAnimating && !hasFalls && activeStep && (
              <motion.div
                className="absolute left-1/2 top-[56%] -translate-x-1/2 rounded-full border border-[#DDBB78]/20 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#E8D6B3]/72"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 0], y: [10, 0, -8] }}
                transition={{ duration: 1.0, delay: 0.5 }}
              >
                {nearMissCount > 0 ? 'Almost. Push Again.' : 'Edging'}
              </motion.div>
            )}
          </div>

          <div className="absolute left-[9%] right-[9%] top-[80%] h-[12%] rounded-b-3xl border border-[#DDBB78]/18 bg-[linear-gradient(180deg,rgba(0,0,0,0.76),rgba(36,25,12,0.72))] shadow-inner overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[2px] w-[90%] -translate-x-1/2 bg-[#DDBB78]/42" />
            <div className="absolute inset-x-4 bottom-3 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-[#E8D6B3]/82">
              <div className="rounded-md bg-white/8 py-1">1x</div>
              <div className="rounded-md bg-[#B8793E]/22 py-1 text-[#FFE78A] shadow-[0_0_18px_rgba(248,198,90,0.16)]">3x</div>
              <div className="rounded-md bg-white/8 py-1">1x</div>
            </div>

            {activeFalls.map((token, index) => {
              const fallSlot = token.fallSlot ?? 1
              const targetX = slotX[fallSlot] + jitterFromId(token.id, 'slot', 6)
              const delay = 0.72 + index * 0.08 + (token.nearMiss ? 0.22 : 0)
              return (
                <motion.div
                  key={`fall-${token.id}`}
                  className="absolute top-[-64%] h-8 w-8 rounded-[48%_52%_45%_55%] border border-[#FFE8A8]/70 bg-[radial-gradient(circle_at_34%_30%,#FFF5C7_0%,#C99635_34%,#1E4FFF_58%,#0A1D4A_100%)] shadow-[0_0_22px_rgba(248,198,90,0.48)]"
                  initial={{ x: `${targetX - 50}%`, y: -28, opacity: 0, scale: 0.95 }}
                  animate={{ x: `${targetX - 50}%`, y: isAnimating ? [0, 28, 78] : 78, opacity: isAnimating ? [0, 1, 0] : 0, scale: isAnimating ? [0.95, 1.08, 0.88] : 0.88 }}
                  transition={{ duration: 0.9, delay, ease: 'easeIn' }}
                  style={{ left: '50%' }}
                />
              )
            })}
          </div>

          {cascadeDepth > 0 && (
            <motion.div
              className="absolute left-1/2 top-[47%] z-30 -translate-x-1/2 rounded-full border border-[#DDBB78]/24 bg-black/76 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#FFE78A] backdrop-blur"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: [0.96, 1.06, 1] }}
            >
              Cascade x{cascadeDepth}
            </motion.div>
          )}

          {bonusActive && (
            <motion.div
              className="absolute left-1/2 top-[31%] z-40 -translate-x-1/2 rounded-full border border-[#DDBB78]/28 bg-black/82 px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#FFE78A] backdrop-blur"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: [0.96, 1.08, 1] }}
            >
              Gimboz Nudge
            </motion.div>
          )}
        </div>

        <motion.div
          className="absolute bottom-[-1%] right-[-1%] z-20 h-[33%] w-[33%]"
          animate={{
            y: bonusActive ? [0, -10, 0] : cascadeDepth > 0 ? [0, -5, 0] : [0, -2, 0],
            rotate: bonusActive ? [0, -3, 3, 0] : cascadeDepth > 0 ? [0, 1.5, -1.5, 0] : 0,
          }}
          transition={{ duration: bonusActive || cascadeDepth > 0 ? 0.6 : 2.8, repeat: bonusActive || cascadeDepth > 0 ? 0 : Infinity }}
        >
          <Image src="/my-game/gimboz-idle.webp" alt="Wild" fill className="object-contain" priority />
        </motion.div>

        {gameCompleted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-[#DDBB78]/20 bg-black/78 px-8 py-6 text-center shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-[#E8D6B3]/58">Final Payout</p>
              <p className="mt-2 text-4xl font-bold text-[#FFE78A]">{formatApe(payoutAmount)} APE</p>
              <p className="mt-2 text-sm text-[#E8D6B3]/58">Bet: {formatApe(betAmount)} APE</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GimbozPushWindow
