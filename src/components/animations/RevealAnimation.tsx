'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ClawMarks } from '@/components/ui/GlowText'

interface RevealAnimationProps {
  playerName: string
  onComplete?: () => void
}

export function RevealAnimation({ playerName, onComplete }: RevealAnimationProps) {
  const [phase, setPhase] = useState<'suspense' | 'countdown' | 'reveal' | 'hold'>('suspense')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('countdown'), 2000)
    const t2 = setTimeout(() => setPhase('reveal'), 5500)
    const t3 = setTimeout(() => {
      setPhase('hold')
      onComplete?.()
    }, 8000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* Fondo radial pulsante */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: phase === 'reveal'
            ? [
                'radial-gradient(ellipse at center, #D4186C44 0%, transparent 60%)',
                'radial-gradient(ellipse at center, #D4186C88 0%, transparent 60%)',
                'radial-gradient(ellipse at center, #D4186C44 0%, transparent 60%)',
              ]
            : 'radial-gradient(ellipse at center, #D4186C11 0%, transparent 60%)',
        }}
        transition={{ duration: 1, repeat: phase === 'reveal' ? Infinity : 0 }}
      />

      {/* Garras */}
      <ClawMarks opacity={phase === 'reveal' ? 0.3 : 0.12} />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />

      {/* Bordes de esquina */}
      {['top-4 left-4 border-t-2 border-l-2', 'top-4 right-4 border-t-2 border-r-2',
        'bottom-4 left-4 border-b-2 border-l-2', 'bottom-4 right-4 border-b-2 border-r-2'].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-8 h-8 border-pink ${cls} opacity-50`}
        />
      ))}

      <div className="relative z-10 text-center px-6 max-w-sm w-full">

        {/* Phase: suspense */}
        <AnimatePresence>
          {phase === 'suspense' && (
            <motion.div
              key="suspense"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.p
                className="font-title text-gray-400 text-lg tracking-[0.45em] uppercase"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                La casa ha decidido...
              </motion.p>
              <motion.div
                className="w-28 h-28 border-2 border-pink flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 20px #D4186C44',
                    '0 0 60px #D4186C',
                    '0 0 20px #D4186C44',
                  ],
                  rotate: 360,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <span className="text-5xl">🐍</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: countdown */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <p className="font-title text-gray-400 text-lg tracking-[0.4em] uppercase">
                Quien abandona la casa es...
              </p>
              <motion.div
                className="flex gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[3, 2, 1].map((n) => (
                  <motion.span
                    key={n}
                    className="font-title text-7xl"
                    initial={{ opacity: 0, scale: 0, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: (3 - n) * 1, type: 'spring', bounce: 0.4 }}
                    style={{
                      color: '#D4186C',
                      textShadow: '0 0 20px #D4186C',
                      WebkitTextStroke: '1px #D4186C',
                    }}
                  >
                    {n}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: reveal */}
        <AnimatePresence>
          {(phase === 'reveal' || phase === 'hold') && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.2, filter: 'blur(40px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <p className="font-title text-gray-500 text-xs tracking-[0.5em] uppercase">
                Abandonando la casa
              </p>

              {/* Nombre en recuadro estilo flyer */}
              <div
                className="relative w-full py-4 px-2"
                style={{
                  border: '2px solid #D4186C',
                  boxShadow: '0 0 40px #D4186C66, inset 0 0 30px #D4186C11',
                }}
              >
                {/* Línea horizontal top */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#D4186C' }} />
                <motion.h2
                  className="font-title text-center leading-none"
                  animate={{
                    textShadow: [
                      '0 0 20px #D4186C, 0 0 40px #D4186C88',
                      '0 0 50px #D4186C, 0 0 100px #D4186C, 0 0 150px #D4186C44',
                      '0 0 20px #D4186C, 0 0 40px #D4186C88',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    fontSize: 'clamp(3rem, 15vw, 8rem)',
                    color: '#D4186C',
                  }}
                >
                  {playerName}
                </motion.h2>
              </div>

              {/* Separador */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-0.5 w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #D4186C, transparent)' }}
              />

              <motion.p
                className="font-title text-xl text-gray-500 tracking-[0.4em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                ABANDONA LA CASA
              </motion.p>

              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🐍
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
