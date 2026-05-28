'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Play, Square, Eye, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  createVoteSession,
  updateVoteSessionStatus,
} from '@/app/actions/admin'
import { VOTE_TYPE_LABELS } from '@/types'
import type { VoteSession, Season, VoteType, VoterType, VoteSessionStatus } from '@/types'

const VOTE_TYPES: VoteType[] = [
  'public_negative', 'public_positive',
  'internal_nomination', 'internal_spontaneous',
  'internal_fulminating', 'internal_leader',
  'internal_positive', 'internal_negative',
]

const statusColor: Record<VoteSessionStatus, string> = {
  draft: 'text-gray-500 border-gray-700',
  open: 'text-green-400 border-green-800',
  closed: 'text-yellow-400 border-yellow-800',
  published: 'text-pink border-pink/40',
}

interface Props {
  sessions: (VoteSession & { season?: { name: string } })[]
  seasons: Season[]
}

export function AdminVotacionesClient({ sessions: initial, seasons }: Props) {
  const [sessions, setSessions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    season_id: seasons[0]?.id ?? '',
    title: '',
    description: '',
    type: 'public_negative' as VoteType,
    voter_type: 'public' as VoterType,
    allows_reason: false,
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createVoteSession(form)
      if (result.error) {
        setError(result.error)
      } else if (result.session) {
        setSessions((prev) => [result.session!, ...prev])
        setShowForm(false)
        setForm({ ...form, title: '', description: '' })
      }
    })
  }

  async function handleStatusChange(sessionId: string, status: VoteSessionStatus) {
    startTransition(async () => {
      await updateVoteSessionStatus(sessionId, status)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, status, ...(status === 'published' ? { published_at: new Date().toISOString() } : {}) }
            : s
        )
      )
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva votación'}
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-6 p-4 rounded-sm overflow-hidden"
            style={{ background: '#1a0a14', border: '1px solid #D4186C33' }}
          >
            <h3 className="font-title text-lg text-white mb-4">Nueva votación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Temporada</label>
                <select value={form.season_id} onChange={(e) => setForm({ ...form, season_id: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none">
                  {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VoteType })}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none">
                  {VOTE_TYPES.map((t) => <option key={t} value={t}>{VOTE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required placeholder="Ej: Gala de nominaciones semana 3"
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none placeholder:text-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Quién puede votar</label>
                <select value={form.voter_type} onChange={(e) => setForm({ ...form, voter_type: e.target.value as VoterType })}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none">
                  <option value="public">Público general</option>
                  <option value="players">Solo jugadoras</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción breve (opcional)"
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none placeholder:text-gray-700" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer">
              <input type="checkbox" checked={form.allows_reason}
                onChange={(e) => setForm({ ...form, allows_reason: e.target.checked })}
                className="accent-pink" />
              Permitir que los votantes escriban un motivo
            </label>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button type="submit" variant="pink" size="sm" loading={isPending}>Crear votación</Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tabla */}
      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-700">
            <p className="font-title text-xl">Sin votaciones aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-3 text-gray-600 font-title text-xs uppercase tracking-wider">Votación</th>
                  <th className="text-left p-3 text-gray-600 font-title text-xs uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left p-3 text-gray-600 font-title text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-right p-3 text-gray-600 font-title text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-800/50 last:border-0">
                    <td className="p-3">
                      <p className="text-white font-medium">{s.title}</p>
                      <p className="text-gray-600 text-xs">{s.season?.name}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">{VOTE_TYPE_LABELS[s.type]}</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-title text-xs uppercase px-2 py-0.5 border ${statusColor[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'draft' && (
                          <button onClick={() => handleStatusChange(s.id, 'open')} disabled={isPending}
                            title="Abrir votación"
                            className="text-green-400 hover:text-green-300 transition-colors p-1">
                            <Play size={14} />
                          </button>
                        )}
                        {s.status === 'open' && (
                          <button onClick={() => handleStatusChange(s.id, 'closed')} disabled={isPending}
                            title="Cerrar votación"
                            className="text-yellow-400 hover:text-yellow-300 transition-colors p-1">
                            <Square size={14} />
                          </button>
                        )}
                        {s.status === 'closed' && (
                          <button onClick={() => handleStatusChange(s.id, 'published')} disabled={isPending}
                            title="Publicar resultado"
                            className="text-pink hover:text-pink-hot transition-colors p-1">
                            <Eye size={14} />
                          </button>
                        )}
                        {s.status !== 'draft' && (
                          <button onClick={() => {
                            if (confirm('¿Resetear esta votación? Se borran todos los votos.')) {
                              startTransition(async () => {
                                const { resetVoteSession } = await import('@/app/actions/admin')
                                await resetVoteSession(s.id)
                                setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, status: 'draft', winner_player_id: null } : x))
                              })
                            }
                          }} disabled={isPending} title="Resetear"
                            className="text-gray-600 hover:text-gray-400 transition-colors p-1">
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
