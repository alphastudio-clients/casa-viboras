'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Player } from '@/types'

interface VoteCardProps {
  player: Player
  selected: boolean
  onSelect: (playerId: string) => void
  disabled?: boolean
  index?: number
  rankDisplay?: number | null  // 1, 2, 3… muestra el número en lugar del check
}

const RANK_LABELS = ['1°', '2°', '3°']

export function VoteCard({
  player,
  selected,
  onSelect,
  disabled = false,
  index = 0,
  rankDisplay,
}: VoteCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onSelect(player.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      disabled={disabled}
      className={`relative w-full text-left transition-all duration-300 rounded-sm overflow-hidden ${
        disabled && !selected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      style={{
        border: selected ? '2px solid #D4186C' : '2px solid #2a2a2a',
        boxShadow: selected ? '0 0 20px #D4186C66, inset 0 0 20px #D4186C11' : 'none',
        background: selected ? '#1a0a14' : '#111',
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Avatar */}
        <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden bg-gray-900 rounded-sm">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              className="object-cover object-top"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-title text-xl text-pink/40">
                {getInitials(player.name)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-title text-lg text-white leading-none tracking-wide">
            {player.name}
          </p>
          {player.nickname && (
            <p className="text-xs text-pink/70 mt-0.5">&ldquo;{player.nickname}&rdquo;</p>
          )}
        </div>

        {/* Badge: rank number o check */}
        <div
          className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 ${
            selected ? 'bg-pink text-black' : 'border border-gray-600'
          }`}
        >
          {selected && rankDisplay != null ? (
            <span className="font-title text-sm leading-none">
              {RANK_LABELS[rankDisplay - 1] ?? rankDisplay}
            </span>
          ) : selected ? (
            <Check size={14} strokeWidth={3} />
          ) : null}
        </div>
      </div>

      {/* Barra inferior al seleccionar */}
      {selected && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink"
          style={{ boxShadow: '0 0 8px #D4186C' }}
          layoutId={`selected-bar-${rankDisplay ?? 'single'}`}
        />
      )}
    </motion.button>
  )
}
