'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { getInitials } from '@/lib/utils'
import type { Player } from '@/types'

interface PlayerCardProps {
  player: Player
  index?: number
}

export function PlayerCard({ player, index = 0 }: PlayerCardProps) {
  const isEliminated = player.status === 'eliminated'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link href={`/jugadores/${player.id}`}>
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            isEliminated ? 'opacity-40 grayscale' : ''
          }`}
          style={{
            background: '#111',
            border: player.status === 'leader'
              ? '2px solid #D4186C'
              : player.status === 'nominated'
              ? '1px solid #facc1566'
              : '1px solid #2a2a2a',
            boxShadow: player.status === 'leader'
              ? '0 0 20px #D4186C44, inset 0 0 10px #D4186C08'
              : 'none',
          }}
        >
          {/* Foto / Avatar */}
          <div className="relative aspect-[3/4] w-full bg-gray-900 overflow-hidden">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.name}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="font-title text-5xl text-pink/40"
                  style={{ textShadow: '0 0 20px #D4186C44' }}
                >
                  {getInitials(player.name)}
                </span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Leader glow */}
            {player.status === 'leader' && (
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(to top, #D4186C22, transparent)',
                    'linear-gradient(to top, #D4186C44, transparent)',
                    'linear-gradient(to top, #D4186C22, transparent)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <StatusBadge status={player.status} />
            </div>

            {/* Instagram link */}
            {player.instagram_handle && (
              <a
                href={`https://instagram.com/${player.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
              >
                <Instagram size={14} />
              </a>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-title text-xl text-white leading-none mb-0.5 tracking-wide">
              {player.name}
            </h3>
            {player.nickname && (
              <p className="text-xs text-pink/80 font-mono tracking-wider mb-2">
                &ldquo;{player.nickname}&rdquo;
              </p>
            )}
            {player.highlight_phrase && (
              <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">
                &ldquo;{player.highlight_phrase}&rdquo;
              </p>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <span className="font-title text-sm text-white tracking-widest uppercase border border-pink px-4 py-2">
              Ver perfil
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
