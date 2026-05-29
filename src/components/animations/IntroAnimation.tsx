'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ClawMarks } from '@/components/ui/GlowText'

export function IntroAnimation() {
  const [phase, setPhase] = useState<'static' | 'logo' | 'text' | 'done'>('static')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 400)
    const t2 = setTimeout(() => setPhase('text'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleEnter = () => {
    setPhase('done')
    if (soundEnabled && audioRef.current) {
      audioRef.current.volume = 0.4
      audioRef.current.play().catch(() => {})
    }
    setTimeout(() => router.push('/casa'), 700)
  }

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0a0a0a' }}
        >
          {/* Fondo radial pulsante */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                'radial-gradient(ellipse 70% 50% at 50% 40%, #D4186C0d 0%, transparent 70%)',
                'radial-gradient(ellipse 70% 50% at 50% 40%, #D4186C22 0%, transparent 70%)',
                'radial-gradient(ellipse 70% 50% at 50% 40%, #D4186C0d 0%, transparent 70%)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Claw marks decorativas */}
          <ClawMarks opacity={0.18} />

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
              opacity: 0.5,
            }}
          />

          {/* Esquinas estilo flyer */}
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls, i) => (
            <motion.div
              key={i}
              className={`absolute w-10 h-10 border-pink ${cls}`}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.5 }}
            />
          ))}

          {/* Línea superior decorativa */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg, transparent, #D4186C, transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg, transparent, #D4186C, transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />

          {/* Contenido central */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xs w-full">

            {/* LOGO */}
            <AnimatePresence>
              {phase !== 'static' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 40, filter: 'blur(20px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative mb-3"
                >
                  {/* Glow detrás del logo */}
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ filter: 'blur(30px)', background: '#D4186C' }}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                  <Image
                    src="/logo-viboras.png"
                    alt="Víboras Rosas"
                    width={200}
                    height={200}
                    className="relative z-10"
                    style={{ filter: 'drop-shadow(0 0 24px #D4186C99)' }}
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textos */}
            <AnimatePresence>
              {phase !== 'static' && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {/* "BIENVENIDA A" */}
                  <motion.p
                    className="font-title tracking-[0.55em] text-xs mb-1 uppercase"
                    style={{ color: '#D4186C' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    BIENVENIDA A
                  </motion.p>

                  {/* Título principal estilo flyer */}
                  <div className="relative mb-3">
                    {/* Primer línea grande */}
                    <motion.h1
                      className="font-title leading-none block text-white"
                      style={{
                        fontSize: 'clamp(3.5rem, 18vw, 6.5rem)',
                        letterSpacing: '0.02em',
                        lineHeight: 0.9,
                      }}
                      animate={{
                        textShadow: [
                          '0 0 10px #D4186C33',
                          '0 0 30px #D4186CAA, 0 0 60px #D4186C44',
                          '0 0 10px #D4186C33',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      LA CASA
                    </motion.h1>
                    {/* Segunda línea: "DE VÍBORAS" en rosa */}
                    <motion.span
                      className="font-title leading-none block"
                      style={{
                        fontSize: 'clamp(2.8rem, 14vw, 5rem)',
                        letterSpacing: '0.02em',
                        color: '#D4186C',
                        lineHeight: 0.9,
                        textShadow: '0 0 20px #D4186CAA',
                      }}
                    >
                      DE VÍBORAS
                    </motion.span>
                  </div>

                  {/* Recuadro "VÍBORAS ROSAS" estilo flyer */}
                  <motion.div
                    className="relative mx-auto mb-4"
                    style={{
                      border: '2px solid #D4186C',
                      boxShadow: '0 0 12px #D4186C44, inset 0 0 12px #D4186C11',
                      padding: '6px 20px',
                      display: 'inline-block',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <span
                      className="font-title tracking-[0.5em] text-sm uppercase block"
                      style={{ color: '#D4186C' }}
                    >
                      VÍBORAS ROSAS · 2026
                    </span>
                  </motion.div>

                  <motion.p
                    className="text-gray-600 text-xs tracking-[0.2em] uppercase mb-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    El reality definitivo
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            {phase === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center gap-3 w-full"
              >
                <motion.button
                  onClick={handleEnter}
                  className="w-full font-title text-xl tracking-[0.25em] uppercase text-black px-8 py-4"
                  style={{
                    background: '#D4186C',
                    letterSpacing: '0.2em',
                    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 20px #D4186C88',
                      '0 0 50px #D4186C, 0 0 100px #D4186C44',
                      '0 0 20px #D4186C88',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ backgroundColor: '#E8005A' }}
                >
                  ENTRAR A LA CASA
                </motion.button>

                <button
                  onClick={() => setSoundEnabled((v) => !v)}
                  className="text-gray-700 text-xs tracking-wider uppercase hover:text-gray-500 transition-colors"
                >
                  {soundEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
                </button>
              </motion.div>
            )}
          </div>

          <audio ref={audioRef} src="/sounds/intro.mp3" preload="none" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
