'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { getInitials, formatDate } from '@/lib/utils'
import { VOTE_TYPE_LABELS } from '@/types'
import type { Player, VoteSession } from '@/types'

interface Props {
  session: VoteSession
  winner: Player | null
}

export function PublicResultView({ session, winner }: Props) {
  const isNegative = session.type.includes('negative') || session.type.includes('nomination') || session.type.includes('fulminating')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at center, #D4186C11 0%, transparent 60%)',
            'radial-gradient(ellipse at center, #D4186C22 0%, transparent 60%)',
            'radial-gradient(ellipse at center, #D4186C11 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      <div className="relative z-10 max-w-sm w-full text-center">
        {/* Type label */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-title text-xs text-gray-600 tracking-[0.5em] uppercase mb-2"
        >
          {VOTE_TYPE_LABELS[session.type]}
        </motion.p>

        {/* Session title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-title text-2xl text-gray-400 mb-8"
        >
          {session.title}
        </motion.h1>

        {winner ? (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-title text-gray-400 text-lg tracking-wider mb-4"
            >
              {isNegative ? 'Quien abandona la casa es...' : 'La elegida es...'}
            </motion.p>

            {/* Winner card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mb-6"
            >
              {/* Photo */}
              <div
                className="w-40 h-40 mx-auto rounded-sm overflow-hidden mb-4 relative"
                style={{
                  boxShadow: '0 0 40px #D4186C, 0 0 80px #D4186C44',
                  border: '2px solid #D4186C',
                }}
              >
                {winner.photo_url ? (
                  <Image
                    src={winner.photo_url}
                    alt={winner.name}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <span className="font-title text-5xl text-pink/40">
                      {getInitials(winner.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <motion.h2
                className="font-title leading-none mb-2"
                animate={{
                  textShadow: [
                    '0 0 20px #D4186C88',
                    '0 0 40px #D4186C, 0 0 80px #D4186C44',
                    '0 0 20px #D4186C88',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  fontSize: 'clamp(2.5rem, 12vw, 5rem)',
                  color: '#D4186C',
                }}
              >
                {winner.name}
              </motion.h2>

              {winner.nickname && (
                <p className="text-gray-500 font-mono text-sm">&ldquo;{winner.nickname}&rdquo;</p>
              )}
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2 }}
              className="h-px bg-gradient-to-r from-transparent via-pink to-transparent mb-6"
            />

            {session.published_at && (
              <p className="text-gray-700 text-xs">
                Publicado el {formatDate(session.published_at)}
              </p>
            )}
          </>
        ) : (
          <div className="py-12">
            <span className="text-6xl block mb-4">🐍</span>
            <p className="font-title text-xl text-gray-500">
              El resultado fue publicado
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8"
        >
          <Link
            href="/votar"
            className="text-gray-700 text-xs hover:text-gray-500 transition-colors uppercase tracking-wider font-title"
          >
            ← Volver a votaciones
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
