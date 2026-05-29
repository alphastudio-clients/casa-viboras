'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Play, Square, Eye, RotateCcw, Pencil, Check, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import {
  createVoteSession,
  updateVoteSession,
  updateVoteSessionStatus,
  getVoteResults,
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

const STATUS_LABELS: Record<VoteSessionStatus, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  closed: 'Cerrada',
  published: 'Publicada',
}

interface EditSessionData {
  title: string
  description: string
  type: VoteType
  voter_type: VoterType
}

interface VoteCount {
  player_id: string
  player_name: string
  player_nickname: string | null
  photo_url: string | null
  vote_count: number
  percentage: number
}

interface Props {
  sessions: (VoteSession & { season?: { name: string } })[]
  seasons: Season[]
}

const INPUT_CLS =
  'w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 rounded-sm focus:outline-none focus:border-pink/50 placeholder:text-gray-700'

export function AdminVotacionesClient({ sessions: initial, seasons }: Props) {
  const [sessions, setSessions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSession, setEditSession] = useState<EditSessionData>({
    title: '', description: '', type: 'public_negative', voter_type: 'public',
  })
  const [statsId, setStatsId] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<Record<string, { counts: VoteCount[]; total: number }>>({})
  const [statsLoading, setStatsLoading] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const [form, setForm] = useState({
    season_id: seasons[0]?.id ?? '',
    title: '',
    description: '',
    type: 'public_negative' as VoteType,
    voter_type: 'public' as VoterType,
    allows_reason: false,
  })

  // ── CREAR ────────────────────────────────────────────────
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

  // ── EDITAR ───────────────────────────────────────────────
  function startEdit(session: VoteSession) {
    setEditingId(session.id)
    setEditSession({
      title: session.title,
      description: session.description ?? '',
      type: session.type,
      voter_type: session.voter_type,
    })
    setEditError(null)
  }

  function cancelEdit() { setEditingId(null) }

  async function handleSaveEdit(sessionId: string) {
    if (!editSession.title.trim()) return
    setEditError(null)
    startTransition(async () => {
      const result = await updateVoteSession(sessionId, editSession)
      if (result.error) {
        setEditError(result.error)
      } else {
        setSessions((prev) => prev.map((s) =>
          s.id === sessionId ? { ...s, ...editSession } : s
        ))
        setEditingId(null)
      }
    })
  }

  // ── STATS ────────────────────────────────────────────────
  async function toggleStats(sessionId: string) {
    if (statsId === sessionId) { setStatsId(null); return }
    setStatsId(sessionId)
    if (statsData[sessionId]) return // ya cargado
    setStatsLoading(sessionId)
    const data = await getVoteResults(sessionId)
    setStatsData((prev) => ({
      ...prev,
      [sessionId]: { counts: data.counts as VoteCount[], total: data.total ?? 0 },
    }))
    setStatsLoading(null)
  }

  // ── CAMBIAR ESTADO ───────────────────────────────────────
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

      {/* Form nueva votación */}
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
                  className={INPUT_CLS}>
                  {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VoteType })}
                  className={INPUT_CLS}>
                  {VOTE_TYPES.map((t) => <option key={t} value={t}>{VOTE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required placeholder="Ej: Gala de nominaciones semana 3"
                  className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Quién puede votar</label>
                <select value={form.voter_type} onChange={(e) => setForm({ ...form, voter_type: e.target.value as VoterType })}
                  className={INPUT_CLS}>
                  <option value="public">Público general</option>
                  <option value="players">Solo jugadoras</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción breve (opcional)"
                className={INPUT_CLS} />
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

      {/* Lista */}
      <div className="rounded-sm overflow-hidden space-y-1" style={{ border: '1px solid #2a2a2a' }}>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-700">
            <p className="font-title text-xl">Sin votaciones aún</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id}>
              {/* Fila principal */}
              <div
                className="p-3 transition-colors"
                style={{
                  background: editingId === s.id ? '#0d0007' : '#111',
                  border: editingId === s.id ? '1px solid #D4186C44' : '1px solid #1a1a1a',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-gray-600 text-xs">{s.season?.name}</span>
                      <span className="text-gray-700 text-xs hidden sm:inline">·</span>
                      <span className="text-gray-600 text-xs hidden sm:inline">{VOTE_TYPE_LABELS[s.type]}</span>
                      <span className="text-gray-700 text-xs hidden sm:inline">·</span>
                      <span className="text-gray-600 text-xs hidden sm:inline">
                        {s.voter_type === 'public' ? 'Público' : 'Solo jugadoras'}
                      </span>
                    </div>
                  </div>

                  {/* Estado */}
                  <span className={`font-title text-xs uppercase px-2 py-0.5 border flex-shrink-0 hidden sm:inline ${statusColor[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>

                  {/* Acciones de estado */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {s.status === 'draft' && (
                      <button onClick={() => handleStatusChange(s.id, 'open')} disabled={isPending}
                        title="Abrir votación"
                        className="text-green-400 hover:text-green-300 transition-colors p-1.5">
                        <Play size={13} />
                      </button>
                    )}
                    {s.status === 'open' && (
                      <button onClick={() => handleStatusChange(s.id, 'closed')} disabled={isPending}
                        title="Cerrar votación"
                        className="text-yellow-400 hover:text-yellow-300 transition-colors p-1.5">
                        <Square size={13} />
                      </button>
                    )}
                    {s.status === 'closed' && (
                      <button onClick={() => handleStatusChange(s.id, 'published')} disabled={isPending}
                        title="Publicar resultado"
                        className="text-pink hover:text-pink-hot transition-colors p-1.5">
                        <Eye size={13} />
                      </button>
                    )}
                    {s.status !== 'draft' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Resetear esta votación? Se borran todos los votos.')) {
                            startTransition(async () => {
                              const { resetVoteSession } = await import('@/app/actions/admin')
                              await resetVoteSession(s.id)
                              setSessions((prev) => prev.map((x) =>
                                x.id === s.id ? { ...x, status: 'draft', winner_player_id: null } : x
                              ))
                            })
                          }
                        }}
                        disabled={isPending}
                        title="Resetear"
                        className="text-gray-600 hover:text-gray-400 transition-colors p-1.5"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}

                    {/* Botón stats */}
                    <button
                      onClick={() => toggleStats(s.id)}
                      className={`p-1.5 rounded transition-colors ${statsId === s.id ? 'text-pink' : 'text-gray-600 hover:text-white'}`}
                      title="Ver porcentajes"
                    >
                      {statsLoading === s.id
                        ? <span className="w-3 h-3 border-2 border-pink/40 border-t-pink rounded-full animate-spin block" />
                        : <BarChart2 size={13} />
                      }
                    </button>

                    {/* Botón editar */}
                    <button
                      onClick={() => editingId === s.id ? cancelEdit() : startEdit(s)}
                      className={`p-1.5 rounded transition-colors ${editingId === s.id ? 'text-pink' : 'text-gray-600 hover:text-white'}`}
                      title="Editar"
                    >
                      {editingId === s.id ? <X size={13} /> : <Pencil size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel de estadísticas */}
              <AnimatePresence>
                {statsId === s.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 py-3 border-x border-b"
                      style={{ background: '#080010', borderColor: '#D4186C22' }}
                    >
                      {statsLoading === s.id ? (
                        <div className="flex items-center gap-2 py-2 text-gray-600 text-xs">
                          <span className="w-3 h-3 border-2 border-pink/40 border-t-pink rounded-full animate-spin" />
                          Cargando votos...
                        </div>
                      ) : statsData[s.id] ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-title text-xs tracking-[0.25em] uppercase" style={{ color: '#D4186C88' }}>
                              Resultados en vivo
                            </p>
                            <p className="text-gray-600 text-xs">
                              {statsData[s.id].total} {statsData[s.id].total === 1 ? 'voto' : 'votos'} totales
                            </p>
                          </div>

                          {statsData[s.id].counts.length === 0 ? (
                            <p className="text-gray-700 text-sm text-center py-2">Sin votos todavía</p>
                          ) : (
                            <div className="space-y-2.5">
                              {statsData[s.id].counts.map((c, i) => (
                                <div key={c.player_id} className="flex items-center gap-3">
                                  {/* Foto */}
                                  <div className="w-7 h-8 bg-gray-900 flex-shrink-0 overflow-hidden relative rounded-sm">
                                    {c.photo_url ? (
                                      <Image src={c.photo_url} alt={c.player_name} fill className="object-cover object-top" sizes="28px" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="font-title text-[8px]" style={{ color: '#D4186C66' }}>
                                          {c.player_name.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Barra */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-white truncate">
                                        {c.player_nickname ? `${c.player_name} "${c.player_nickname}"` : c.player_name}
                                      </span>
                                      <span className="text-xs font-title ml-2 flex-shrink-0" style={{ color: i === 0 ? '#D4186C' : '#666' }}>
                                        {c.percentage}%
                                        <span className="text-gray-700 font-sans ml-1">({c.vote_count})</span>
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${c.percentage}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.08 }}
                                        className="h-full rounded-full"
                                        style={{
                                          background: i === 0 ? '#D4186C' : '#333',
                                          boxShadow: i === 0 ? '0 0 6px #D4186C88' : 'none',
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Botón refrescar */}
                          <button
                            onClick={async () => {
                              setStatsLoading(s.id)
                              const data = await getVoteResults(s.id)
                              setStatsData((prev) => ({
                                ...prev,
                                [s.id]: { counts: data.counts as VoteCount[], total: data.total ?? 0 },
                              }))
                              setStatsLoading(null)
                            }}
                            className="mt-3 text-gray-700 hover:text-gray-500 text-xs flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw size={10} /> Actualizar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Panel de edición expandible */}
              <AnimatePresence>
                {editingId === s.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-4 border-x border-b"
                      style={{ background: '#0a0005', borderColor: '#D4186C33' }}
                    >
                      <p className="font-title text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4186C' }}>
                        Editando: {s.title}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Título *</label>
                          <input
                            type="text"
                            value={editSession.title}
                            onChange={(e) => setEditSession({ ...editSession, title: e.target.value })}
                            placeholder="Título de la votación"
                            className={INPUT_CLS}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Tipo</label>
                          <select
                            value={editSession.type}
                            onChange={(e) => setEditSession({ ...editSession, type: e.target.value as VoteType })}
                            className={INPUT_CLS}
                          >
                            {VOTE_TYPES.map((t) => (
                              <option key={t} value={t} style={{ background: '#111' }}>{VOTE_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Quién puede votar</label>
                          <select
                            value={editSession.voter_type}
                            onChange={(e) => setEditSession({ ...editSession, voter_type: e.target.value as VoterType })}
                            className={INPUT_CLS}
                          >
                            <option value="public" style={{ background: '#111' }}>Público general</option>
                            <option value="players" style={{ background: '#111' }}>Solo jugadoras</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
                          <input
                            type="text"
                            value={editSession.description}
                            onChange={(e) => setEditSession({ ...editSession, description: e.target.value })}
                            placeholder="Descripción breve (opcional)"
                            className={INPUT_CLS}
                          />
                        </div>
                      </div>

                      {editError && <p className="text-red-400 text-sm mb-3">{editError}</p>}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="pink"
                          size="sm"
                          loading={isPending}
                          onClick={() => handleSaveEdit(s.id)}
                          className="flex items-center gap-1.5"
                        >
                          <Check size={14} /> Guardar cambios
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
