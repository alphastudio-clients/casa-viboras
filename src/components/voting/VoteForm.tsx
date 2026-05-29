'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X } from 'lucide-react'
import { VoteCard } from './VoteCard'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { castVote, castMultiVote } from '@/app/actions/votes'
import { VOTE_WEIGHTS, isMultiVoteType } from '@/types'
import { getInitials } from '@/lib/utils'
import type { Player, VoteSession, Profile } from '@/types'

interface VoteFormProps {
  session: VoteSession
  players: Player[]
  profile: Profile | null   // null para usuarios anónimos
  hasVoted: boolean
}

const ORDINALS = ['1°', '2°', '3°']
const RANK_NAMES = ['primera', 'segunda', 'tercera']

export function VoteForm({ session, players, profile, hasVoted: initialHasVoted }: VoteFormProps) {
  const isMulti = isMultiVoteType(session.type)
  const weights = VOTE_WEIGHTS[session.type] ?? []

  // ── single vote state ──
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  // ── multi vote state ──
  const [picks, setPicks] = useState<string[]>([])  // ordered player IDs

  const [reason, setReason] = useState('')
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ─── multi-pick helpers ────────────────────────────────────
  function handleMultiSelect(playerId: string) {
    setPicks((prev) => {
      const idx = prev.indexOf(playerId)
      if (idx !== -1) {
        // Ya está → quitar
        return prev.filter((id) => id !== playerId)
      }
      if (prev.length >= weights.length) {
        // Lleno → reemplazar el último
        return [...prev.slice(0, weights.length - 1), playerId]
      }
      return [...prev, playerId]
    })
  }

  function removePick(idx: number) {
    setPicks((prev) => prev.filter((_, i) => i !== idx))
  }

  // ─── submit ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      let result: { error?: string; success?: boolean }

      if (isMulti) {
        if (picks.length !== weights.length) {
          setError(`Tenés que elegir exactamente ${weights.length} jugadoras.`)
          return
        }
        result = await castMultiVote({
          vote_session_id: session.id,
          picks,
          reason: reason.trim() || undefined,
        })
      } else {
        if (!selectedPlayerId) return
        result = await castVote({
          vote_session_id: session.id,
          target_player_id: selectedPlayerId,
          reason: reason.trim() || undefined,
        })
      }

      if (result.error) {
        setError(result.error)
      } else {
        setHasVoted(true)
      }
    })
  }

  // ─── confirmación ─────────────────────────────────────────
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
        <p className="text-gray-500 text-sm mb-2">Tu voto fue registrado correctamente.</p>
        <p className="text-gray-700 text-xs">Los resultados son privados hasta que el admin los publique.</p>
      </motion.div>
    )
  }

  // ─── MULTI-PICK form ──────────────────────────────────────
  if (isMulti) {
    return (
      <form onSubmit={handleSubmit}>
        {/* Instrucciones */}
        <div
          className="mb-5 p-4 rounded-sm"
          style={{ background: '#1a0a14', border: '1px solid #D4186C33' }}
        >
          <p className="font-title text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#D4186C88' }}>
            Sistema de puntos
          </p>
          <div className="space-y-1">
            {weights.map((pts, i) => (
              <p key={i} className="text-gray-400 text-sm flex items-center gap-2">
                <span className="font-title text-white">{ORDINALS[i]}</span>
                nominada
                <span
                  className="ml-auto font-title text-base"
                  style={{ color: '#D4186C' }}
                >
                  {pts} {pts === 1 ? 'punto' : 'puntos'}
                </span>
              </p>
            ))}
          </div>
        </div>

        {/* Slots seleccionados */}
        <div className="mb-5 space-y-2">
          {weights.map((pts, i) => {
            const pickedId = picks[i]
            const pickedPlayer = pickedId ? players.find((p) => p.id === pickedId) : null

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-sm"
                style={{
                  background: pickedPlayer ? '#0d0007' : '#0a0a0a',
                  border: pickedPlayer ? '1px solid #D4186C55' : '1px dashed #333',
                }}
              >
                {/* Número */}
                <div
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-title text-sm"
                  style={{
                    background: pickedPlayer ? '#D4186C' : 'transparent',
                    border: pickedPlayer ? 'none' : '1px solid #444',
                    color: pickedPlayer ? 'black' : '#555',
                  }}
                >
                  {ORDINALS[i]}
                </div>

                {pickedPlayer ? (
                  <>
                    {/* Mini foto */}
                    <div className="w-8 h-8 flex-shrink-0 overflow-hidden rounded-sm bg-gray-900 relative">
                      {pickedPlayer.photo_url ? (
                        <Image
                          src={pickedPlayer.photo_url}
                          alt={pickedPlayer.name}
                          fill
                          className="object-cover object-top"
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-title text-[9px]" style={{ color: '#D4186C66' }}>
                            {getInitials(pickedPlayer.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{pickedPlayer.name}</p>
                      <p className="text-xs" style={{ color: '#D4186C88' }}>
                        {pts} {pts === 1 ? 'punto' : 'puntos'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePick(i)}
                      className="text-gray-600 hover:text-gray-400 p-1 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm flex-1">
                    {RANK_NAMES[i] ? `Tu ${RANK_NAMES[i]} nominada…` : `Nominada ${i + 1}…`}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Línea divisoria */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs uppercase tracking-wider">Elegí</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Lista de jugadoras */}
        {players.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="font-title text-xl">No hay jugadoras disponibles</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {players.map((player, i) => {
              const rankIdx = picks.indexOf(player.id)
              const isSelected = rankIdx !== -1
              return (
                <VoteCard
                  key={player.id}
                  player={player}
                  selected={isSelected}
                  onSelect={handleMultiSelect}
                  disabled={isPending}
                  index={i}
                  rankDisplay={isSelected ? rankIdx + 1 : null}
                />
              )
            })}
          </div>
        )}

        {/* Motivo (opcional, solo si allows_reason) */}
        {session.allows_reason && picks.length > 0 && (
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

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4 border border-red-800/50 bg-red-900/20 p-3 rounded-sm"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          variant="pink"
          size="xl"
          className="w-full"
          loading={isPending}
          disabled={picks.length < weights.length || isPending}
          glow={picks.length === weights.length}
        >
          {picks.length < weights.length
            ? `Elegí ${weights.length - picks.length} más`
            : 'Confirmar nominaciones'}
        </Button>

        <p className="text-center text-gray-700 text-xs mt-4">
          Solo podés nominar una vez. Tus nominaciones son definitivas.
        </p>
      </form>
    )
  }

  // ─── SINGLE-PICK form (tipos originales) ─────────────────
  const isNegativeVote = session.type.includes('negative') || session.type.includes('nomination') || session.type.includes('spontaneous')

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-gray-500 text-sm text-center mb-6">
        {isNegativeVote
          ? 'Seleccioná a quién querés nominar / que abandone la casa'
          : 'Seleccioná a quién querés que permanezca / sea líder'}
      </p>

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

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center mb-4 border border-red-800/50 bg-red-900/20 p-3 rounded-sm"
        >
          {error}
        </motion.p>
      )}

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
