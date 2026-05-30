'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Download, Eye, Trophy, Users } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import {
  getVoteResults,
  exportVotesCSV,
  setVoteWinner,
  updateVoteSessionStatus,
  setTopNominated,
} from '@/app/actions/admin'
import { VOTE_TYPE_LABELS, VOTE_WEIGHTS } from '@/types'
import { getInitials } from '@/lib/utils'
import type { VoteSession } from '@/types'

interface VoteCount {
  player_id: string
  player_name: string
  player_nickname: string | null
  photo_url: string | null
  vote_count: number
  percentage: number
}

interface VoteDetail {
  voter: { display_name?: string; email?: string } | null
  target_player_id: string
  reason: string | null
  created_at: string
  rank?: number
}

interface Props {
  sessions: (VoteSession & { season?: { name: string } })[]
}

const TOP_N = 4

export function AdminResultsClient({ sessions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { counts: VoteCount[]; votes: VoteDetail[]; total: number }>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadResults(sessionId: string) {
    if (results[sessionId]) {
      setExpanded(expanded === sessionId ? null : sessionId)
      return
    }
    setLoading(sessionId)
    const data = await getVoteResults(sessionId)
    setResults((prev) => ({
      ...prev,
      [sessionId]: {
        counts: data.counts as VoteCount[],
        votes: data.votes as VoteDetail[],
        total: data.total ?? 0,
      },
    }))
    setLoading(null)
    setExpanded(sessionId)
  }

  async function handleExportCSV(sessionId: string, title: string) {
    const csv = await exportVotesCSV(sessionId)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `votos-${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePublish(sessionId: string, winnerId: string) {
    startTransition(async () => {
      await setVoteWinner(sessionId, winnerId)
      await updateVoteSessionStatus(sessionId, 'published')
    })
  }

  async function handleSetNominated(sessionId: string, n: number) {
    startTransition(async () => {
      await setTopNominated(sessionId, n)
    })
  }

  return (
    <div className="space-y-3">
      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-700">
          <p className="font-title text-xl">Sin resultados disponibles</p>
          <p className="text-sm mt-1">Cerrá una votación para ver los resultados</p>
        </div>
      )}

      {sessions.map((session) => {
        const res = results[session.id]
        const isExpanded = expanded === session.id
        const isLoading = loading === session.id
        const isMulti = session.type in VOTE_WEIGHTS
        const pointLabel = isMulti ? 'pts' : 'votos'

        return (
          <div
            key={session.id}
            className="rounded-sm overflow-hidden"
            style={{ border: '1px solid #2a2a2a', background: '#111' }}
          >
            {/* Header clickeable */}
            <button
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/2 transition-colors"
              onClick={() => loadResults(session.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-xs font-title uppercase px-1.5 py-0.5 border ${
                    session.status === 'published'
                      ? 'text-pink border-pink/40'
                      : 'text-yellow-400 border-yellow-800'
                  }`}>
                    {session.status}
                  </span>
                  {isMulti && (
                    <span className="text-xs text-gray-700 border border-gray-800 px-1.5 py-0.5 font-title uppercase">
                      ponderada
                    </span>
                  )}
                </div>
                <p className="text-white font-medium truncate">{session.title}</p>
                <p className="text-gray-600 text-xs">
                  {session.season?.name} · {VOTE_TYPE_LABELS[session.type]}
                </p>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                {isLoading
                  ? <span className="w-4 h-4 border-2 border-pink/40 border-t-pink rounded-full animate-spin block" />
                  : <ChevronDown size={16} className="text-gray-600" />
                }
              </motion.div>
            </button>

            {/* Resultados expandidos */}
            <AnimatePresence>
              {isExpanded && res && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-gray-800">
                    {/* Totales */}
                    <div className="flex items-center gap-3 mt-3 mb-4 flex-wrap">
                      <p className="text-gray-600 text-xs flex items-center gap-1.5">
                        <Users size={11} />
                        {res.total} {res.total === 1 ? 'votante' : 'votantes'}
                      </p>
                      {isMulti && (
                        <p className="text-gray-700 text-xs">
                          · ponderado {VOTE_WEIGHTS[session.type]?.join('+')} pts
                        </p>
                      )}
                    </div>

                    {/* Ranking */}
                    <div className="space-y-2 mb-5">
                      {res.counts.map((c, i) => {
                        const isTop = i < TOP_N
                        const isFirst = i === 0

                        return (
                          <div
                            key={c.player_id}
                            className="flex items-center gap-3 p-2 rounded-sm"
                            style={{
                              background: isTop ? '#0d0007' : 'transparent',
                              border: `1px solid ${isFirst ? '#D4186C33' : isTop ? '#1e1e1e' : 'transparent'}`,
                            }}
                          >
                            {/* Posición */}
                            <span
                              className="font-title text-sm w-6 text-center flex-shrink-0"
                              style={{ color: isFirst ? '#D4186C' : isTop ? '#777' : '#444' }}
                            >
                              {i + 1}°
                            </span>

                            {/* Foto */}
                            <div className="w-9 h-10 flex-shrink-0 overflow-hidden bg-gray-900 relative rounded-sm">
                              {c.photo_url ? (
                                <Image
                                  src={c.photo_url}
                                  alt={c.player_name}
                                  fill
                                  className="object-cover object-top"
                                  sizes="36px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="font-title text-[9px]" style={{ color: '#D4186C44' }}>
                                    {getInitials(c.player_name)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Barra + nombre */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm truncate ${isTop ? 'text-white' : 'text-gray-600'}`}>
                                  {c.player_name}
                                </span>
                                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                  <span
                                    className="font-title text-xs"
                                    style={{ color: isFirst ? '#D4186C' : '#666' }}
                                  >
                                    {c.percentage}%
                                  </span>
                                  <span className="text-gray-700 text-xs">
                                    ({c.vote_count} {pointLabel})
                                  </span>
                                  {session.status === 'closed' && (
                                    <button
                                      onClick={() => handlePublish(session.id, c.player_id)}
                                      disabled={isPending}
                                      title="Publicar como ganadora"
                                      className="text-pink/40 hover:text-pink transition-colors ml-1"
                                    >
                                      <Trophy size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.percentage}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.07 }}
                                  className="h-full rounded-full"
                                  style={{
                                    background: isFirst ? '#D4186C' : isTop ? '#3a1a2a' : '#222',
                                    boxShadow: isFirst ? '0 0 6px #D4186C88' : 'none',
                                  }}
                                />
                              </div>
                            </div>

                            {/* Etiqueta top N */}
                            {isTop && (
                              <span
                                className="font-title text-[9px] tracking-wider uppercase px-1 py-0.5 border flex-shrink-0"
                                style={{
                                  color: isFirst ? '#D4186C' : '#666',
                                  borderColor: isFirst ? '#D4186C33' : '#333',
                                }}
                              >
                                top {i + 1}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Detalle de votos internos */}
                    {session.voter_type === 'players' && res.votes.length > 0 && (
                      <details className="mb-4">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 uppercase tracking-wider select-none">
                          Ver detalle ({res.votes.length} registros)
                        </summary>
                        <div className="mt-2 max-h-52 overflow-y-auto space-y-0.5">
                          {res.votes.map((v, i) => (
                            <div key={i} className="flex items-center py-1.5 border-b border-gray-800/50 text-xs gap-2">
                              <span className="text-gray-500 truncate flex-1 min-w-0">
                                {v.voter?.display_name ?? v.voter?.email ?? 'Anónimo'}
                              </span>
                              {v.rank != null && (
                                <span className="text-pink/50 font-title text-[10px] flex-shrink-0">
                                  {v.rank}°
                                </span>
                              )}
                              <span className="text-gray-700 flex-shrink-0">→</span>
                              <span className="text-white flex-shrink-0 truncate max-w-[100px]">
                                {res.counts.find((c) => c.player_id === v.target_player_id)?.player_name ?? '?'}
                              </span>
                              {v.reason && (
                                <span className="text-gray-700 italic truncate max-w-[80px] flex-shrink-0">
                                  {v.reason}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportCSV(session.id, session.title)}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <Download size={12} />
                        Exportar CSV
                      </Button>

                      {session.status === 'closed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(session.id, res.counts[0]?.player_id)}
                            loading={isPending}
                            disabled={!res.counts[0] || isPending}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <Eye size={12} />
                            Publicar resultado
                          </Button>

                          {(session.type === 'internal_nomination' || session.type === 'internal_spontaneous') && (
                            <Button
                              variant="pink"
                              size="sm"
                              onClick={() => {
                                const n = Math.min(TOP_N, res.counts.length)
                                if (confirm(`¿Poner los top ${n} jugadores más votados en placa?`)) {
                                  handleSetNominated(session.id, n)
                                }
                              }}
                              loading={isPending}
                              disabled={res.counts.length === 0 || isPending}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <Users size={12} />
                              Top {Math.min(TOP_N, res.counts.length)} en placa
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
