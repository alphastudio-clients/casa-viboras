'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Download, Eye, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getVoteResults, exportVotesCSV, setVoteWinner, updateVoteSessionStatus } from '@/app/actions/admin'
import { VOTE_TYPE_LABELS } from '@/types'
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
}

interface Props {
  sessions: (VoteSession & { season?: { name: string } })[]
}

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

  async function handleSetWinner(sessionId: string, playerId: string) {
    startTransition(async () => {
      await setVoteWinner(sessionId, playerId)
      await updateVoteSessionStatus(sessionId, 'published')
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

        return (
          <div
            key={session.id}
            className="rounded-sm overflow-hidden"
            style={{ border: '1px solid #2a2a2a', background: '#111' }}
          >
            {/* Header */}
            <button
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/2 transition-colors"
              onClick={() => loadResults(session.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-title uppercase px-1.5 py-0.5 border ${
                    session.status === 'published'
                      ? 'text-pink border-pink/40'
                      : 'text-yellow-400 border-yellow-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-white font-medium truncate">{session.title}</p>
                <p className="text-gray-600 text-xs">{session.season?.name} · {VOTE_TYPE_LABELS[session.type]}</p>
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
                    <p className="text-gray-600 text-xs uppercase tracking-wider mt-3 mb-3">
                      Total: <span className="text-white">{res.total} votos</span>
                    </p>

                    {/* Ranking */}
                    <div className="space-y-2 mb-4">
                      {res.counts.map((c, i) => (
                        <div key={c.player_id} className="flex items-center gap-3">
                          <span className="font-title text-gray-600 text-sm w-5">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white">{c.player_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{c.vote_count} votos · {c.percentage}%</span>
                                {session.status === 'closed' && (
                                  <button
                                    onClick={() => handleSetWinner(session.id, c.player_id)}
                                    disabled={isPending}
                                    className="text-pink/60 hover:text-pink transition-colors"
                                    title="Marcar como resultado y publicar"
                                  >
                                    <Trophy size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${c.percentage}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="h-full"
                                style={{
                                  background: i === 0 ? '#D4186C' : '#3a3a3a',
                                  boxShadow: i === 0 ? '0 0 8px #D4186C88' : 'none',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Detalle de votos internos */}
                    {session.voter_type === 'players' && (
                      <details className="mb-4">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 uppercase tracking-wider select-none">
                          Ver detalle de votos ({res.votes.length})
                        </summary>
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                          {res.votes.map((v, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
                              <span className="text-gray-500">
                                {v.voter?.display_name ?? v.voter?.email ?? 'Anónimo'}
                              </span>
                              <span className="text-gray-600 mx-2">→</span>
                              <span className="text-white">
                                {res.counts.find((c) => c.player_id === v.target_player_id)?.player_name ?? '?'}
                              </span>
                              {v.reason && (
                                <span className="text-gray-700 ml-2 italic truncate max-w-[100px]">{v.reason}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetWinner(session.id, res.counts[0]?.player_id)}
                          loading={isPending}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <Eye size={12} />
                          Publicar top 1
                        </Button>
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
