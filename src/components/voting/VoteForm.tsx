'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { VoteCard } from './VoteCard'
import { Button } from '@/components/ui/Button'
import { castVote } from '@/app/actions/votes'
import type { Player, VoteSession, Profile } from '@/types'

interface VoteFormProps {
  session: VoteSession
  players: Player[]
  profile: Profile
  hasVoted: boolean
}

export function VoteForm({ session, players, profile, hasVoted: initialHasVoted }: VoteFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isNegativeVote = session.type.includes('negative') || session.type.includes('nomination') || session.type.includes('fulminating') || session.type.includes('spontaneous')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlayerId) return

    setError(null)
    startTransition(async () => {
      const result = await castVote({
        vote_session_id: session.id,
        target_player_id: selectedPlayerId,
        reason: reason.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setHasVoted(true)
      }
    })
  }

  if (hasVoted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center py-16"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: ['0 0 20px #D4186C44', '0 0 60px #D4186C', '0 0 20px #D4186C44'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-pink flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="text-black" size={36} />
        </motion.div>

        <h2 className="font-title text-3xl text-white mb-2">¡Voto registrado!</h2>
        <p className="text-gray-500 text-sm mb-2">
          Tu voto fue registrado correctamente.
        </p>
        <p className="text-gray-700 text-xs">
          Los resultados son privados hasta que el admin los publique.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Instrucción */}
      <p className="text-gray-500 text-sm text-center mb-6">
        {isNegativeVote
          ? 'Seleccioná a quién querés nominar / que abandone la casa'
          : 'Seleccioná a quién querés que permanezca / sea líder'}
      </p>

      {/* Lista de jugadoras */}
      {players.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="font-title text-xl">No hay jugadoras disponibles</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {players.map((player, i) => (
            <VoteCard
              key={player.id}
              player={player}
              selected={selectedPlayerId === player.id}
              onSelect={setSelectedPlayerId}
              disabled={isPending}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Motivo opcional */}
      {session.allows_reason && selectedPlayerId && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2 font-title">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="¿Por qué elegís a esta jugadora?"
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-3 rounded-sm resize-none focus:outline-none focus:border-pink/60 placeholder:text-gray-700"
              disabled={isPending}
            />
            <p className="text-gray-700 text-xs text-right mt-1">{reason.length}/300</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center mb-4 border border-red-800/50 bg-red-900/20 p-3 rounded-sm"
        >
          {error}
        </motion.p>
      )}

      {/* Botón */}
      <Button
        type="submit"
        variant="pink"
        size="xl"
        className="w-full"
        loading={isPending}
        disabled={!selectedPlayerId || isPending}
        glow={!!selectedPlayerId}
      >
        Confirmar voto
      </Button>

      <p className="text-center text-gray-700 text-xs mt-4">
        Solo podés votar una vez. Tu voto es definitivo.
      </p>
    </form>
  )
}
