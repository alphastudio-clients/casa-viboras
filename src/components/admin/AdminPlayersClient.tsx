'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Check, Camera } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import {
  createPlayer,
  updatePlayer,
  updatePlayerStatus,
  deletePlayer,
  uploadPlayerPhoto,
  linkPlayerToProfile,
} from '@/app/actions/admin'
import { getInitials } from '@/lib/utils'
import type { Player, Season, PlayerStatus, Profile } from '@/types'

const STATUSES: PlayerStatus[] = ['active', 'nominated', 'leader', 'eliminated', 'saved']
const STATUS_LABELS: Record<PlayerStatus, string> = {
  active: 'En la casa',
  nominated: 'En placa',
  leader: 'Líder',
  eliminated: 'Eliminada',
  saved: 'Salvada',
}
const STATUS_COLORS: Record<PlayerStatus, string> = {
  active: '#4ade80',
  nominated: '#facc15',
  leader: '#D4186C',
  eliminated: '#555',
  saved: '#60a5fa',
}

interface EditData {
  name: string
  nickname: string
  description: string
  highlight_phrase: string
  instagram_handle: string
}

interface Props {
  players: (Player & { season?: { name: string } })[]
  seasons: Season[]
  profiles: Profile[]
}

const INPUT_CLS =
  'w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 rounded-sm focus:outline-none focus:border-pink/50 placeholder:text-gray-700'

export function AdminPlayersClient({ players: initial, seasons, profiles }: Props) {
  const [players, setPlayers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditData>({
    name: '', nickname: '', description: '', highlight_phrase: '', instagram_handle: '',
  })
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    season_id: seasons[0]?.id ?? '',
    name: '', nickname: '', description: '',
    highlight_phrase: '', instagram_handle: '',
    status: 'active' as PlayerStatus,
  })

  // ── EDICIÓN ──────────────────────────────────────────────
  function startEdit(player: Player) {
    setEditingId(player.id)
    setEditData({
      name: player.name,
      nickname: player.nickname ?? '',
      description: player.description ?? '',
      highlight_phrase: player.highlight_phrase ?? '',
      instagram_handle: player.instagram_handle ?? '',
    })
  }

  function cancelEdit() { setEditingId(null) }

  async function handleSaveEdit(playerId: string) {
    if (!editData.name.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await updatePlayer(playerId, editData)
      if (result.error) {
        setError(result.error)
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === playerId ? { ...p, ...editData } : p
        ))
        setEditingId(null)
      }
    })
  }

  // ── VINCULAR USUARIA ─────────────────────────────────────
  async function handleLink(playerId: string, profileId: string) {
    setError(null)
    startTransition(async () => {
      const result = await linkPlayerToProfile(playerId, profileId || null)
      if (result.error) {
        setError(result.error)
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === playerId ? { ...p, profile_id: profileId || null } : p
        ))
      }
    })
  }

  // ── FOTO ─────────────────────────────────────────────────
  async function handlePhotoUpload(playerId: string, file: File) {
    setError(null)
    setUploadingId(playerId)
    const fd = new FormData()
    fd.append('photo', file)
    fd.append('playerId', playerId)
    const result = await uploadPlayerPhoto(fd)
    setUploadingId(null)
    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      setPlayers(prev => prev.map(p =>
        p.id === playerId ? { ...p, photo_url: result.url! } : p
      ))
    }
  }

  // ── ESTADO ───────────────────────────────────────────────
  async function handleStatusChange(playerId: string, status: PlayerStatus) {
    startTransition(async () => {
      await updatePlayerStatus(playerId, status)
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status } : p))
    })
  }

  // ── ELIMINAR ─────────────────────────────────────────────
  async function handleDelete(playerId: string) {
    if (!confirm('¿Eliminar esta jugadora? No se puede deshacer.')) return
    startTransition(async () => {
      await deletePlayer(playerId)
      setPlayers(prev => prev.filter(p => p.id !== playerId))
    })
  }

  // ── CREAR ────────────────────────────────────────────────
  function resetForm() {
    setForm({ season_id: seasons[0]?.id ?? '', name: '', nickname: '', description: '', highlight_phrase: '', instagram_handle: '', status: 'active' })
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createPlayer(form)
      if (result.error) { setError(result.error) }
      else if (result.player) { setPlayers(prev => [...prev, result.player!]); resetForm() }
    })
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div>
      {/* Botón nueva */}
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(v => !v)} variant="outline" size="sm" className="flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva jugadora'}
        </Button>
      </div>

      {/* Form nueva jugadora */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-6 p-4 rounded-sm overflow-hidden"
            style={{ background: '#1a0a14', border: '1px solid #D4186C33' }}
          >
            <h3 className="font-title text-lg text-white mb-4 tracking-wider">Nueva jugadora</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Temporada *</label>
                <select value={form.season_id} onChange={e => setForm({ ...form, season_id: e.target.value })}
                  className={INPUT_CLS}>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PlayerStatus })}
                  className={INPUT_CLS}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre completo" className={INPUT_CLS} required />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Apodo</label>
                <input type="text" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })}
                  placeholder="La Vale..." className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Instagram</label>
                <input type="text" value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })}
                  placeholder="handle sin @" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Frase</label>
                <input type="text" value={form.highlight_phrase} onChange={e => setForm({ ...form, highlight_phrase: e.target.value })}
                  placeholder="Su frase icónica" className={INPUT_CLS} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Bio breve..." className={`${INPUT_CLS} resize-none`} />
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" variant="pink" size="sm" loading={isPending}>Crear jugadora</Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {error && !showForm && (
        <p className="text-red-400 text-sm mb-3 p-3 border border-red-800 bg-red-900/10">{error}</p>
      )}

      {/* Lista */}
      <div className="space-y-1">
        {players.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            <p className="font-title text-xl">Sin jugadoras aún</p>
          </div>
        )}

        {players.map(player => (
          <div key={player.id}>
            {/* Fila principal */}
            <div
              className="p-3 transition-colors"
              style={{
                background: editingId === player.id ? '#0d0007' : '#111',
                border: editingId === player.id ? '1px solid #D4186C44' : '1px solid #222',
              }}
            >
              <div className="flex items-center gap-3">

                {/* Foto con hover para subir */}
                <div className="relative w-12 h-14 flex-shrink-0 bg-gray-900 overflow-hidden group cursor-pointer">
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url} alt={player.name} fill
                      className="object-cover object-top" sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-title text-sm" style={{ color: '#D4186C66' }}>
                        {getInitials(player.name)}
                      </span>
                    </div>
                  )}
                  {/* Overlay cámara */}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-1">
                    {uploadingId === player.id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera size={14} className="text-white" />
                        <span className="text-white text-[9px] font-title tracking-wider">FOTO</span>
                      </>
                    )}
                    <input
                      type="file" accept="image/*" className="hidden"
                      disabled={uploadingId !== null}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(player.id, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {/* Nombre + temporada */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{player.name}</p>
                  {player.nickname && (
                    <p className="text-xs truncate" style={{ color: '#D4186C99' }}>&ldquo;{player.nickname}&rdquo;</p>
                  )}
                  <p className="text-gray-700 text-xs hidden sm:block truncate">{player.season?.name}</p>
                </div>

                {/* Estado */}
                <select
                  value={player.status}
                  onChange={e => handleStatusChange(player.id, e.target.value as PlayerStatus)}
                  disabled={isPending}
                  className="bg-transparent text-xs font-title uppercase tracking-wider focus:outline-none cursor-pointer hidden sm:block flex-shrink-0"
                  style={{ color: STATUS_COLORS[player.status] }}
                >
                  {STATUSES.map(s => <option key={s} value={s} style={{ color: 'white', background: '#111' }}>{STATUS_LABELS[s]}</option>)}
                </select>

                {/* Botones */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => editingId === player.id ? cancelEdit() : startEdit(player)}
                    className={`p-2 rounded transition-colors ${editingId === player.id ? 'text-pink' : 'text-gray-600 hover:text-white'}`}
                    title="Editar"
                  >
                    {editingId === player.id ? <X size={13} /> : <Edit2 size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    disabled={isPending}
                    className="p-2 text-gray-700 hover:text-red-400 transition-colors rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de edición expandible */}
            <AnimatePresence>
              {editingId === player.id && (
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
                      Editando: {player.name}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Nombre *</label>
                        <input
                          type="text" value={editData.name}
                          onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className={INPUT_CLS}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Apodo</label>
                        <input
                          type="text" value={editData.nickname}
                          onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                          placeholder="La Vale..."
                          className={INPUT_CLS}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Instagram</label>
                        <input
                          type="text" value={editData.instagram_handle}
                          onChange={e => setEditData({ ...editData, instagram_handle: e.target.value })}
                          placeholder="handle sin @"
                          className={INPUT_CLS}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Frase icónica</label>
                        <input
                          type="text" value={editData.highlight_phrase}
                          onChange={e => setEditData({ ...editData, highlight_phrase: e.target.value })}
                          placeholder="Su frase..."
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
                      <textarea
                        value={editData.description}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                        rows={2} placeholder="Bio breve de la jugadora..."
                        className={`${INPUT_CLS} resize-none`}
                      />
                    </div>

                    {/* Vincular usuaria */}
                    <div className="mb-4 p-3" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Vincular cuenta de usuaria</p>
                      <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                        Seleccioná qué usuaria (que haya iniciado sesión con Google) corresponde a esta jugadora. Esto le da acceso a las votaciones internas.
                      </p>
                      <select
                        value={player.profile_id ?? ''}
                        onChange={e => handleLink(player.id, e.target.value)}
                        disabled={isPending}
                        className="w-full text-sm p-2.5 rounded-sm focus:outline-none focus:border-pink/50"
                        style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: 'white' }}
                      >
                        <option value="">— Sin vincular —</option>
                        {profiles.map(p => {
                          const label = p.display_name
                            ? `${p.display_name} (${p.email})`
                            : p.email ?? p.id
                          const isLinkedElsewhere = p.player_id && p.player_id !== player.id
                          return (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={!!isLinkedElsewhere}
                              style={{ background: '#111' }}
                            >
                              {isLinkedElsewhere ? `[Vinculada] ${label}` : label}
                            </option>
                          )
                        })}
                      </select>
                      {player.profile_id && (
                        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                          <Check size={10} /> Vinculada a:{' '}
                          {profiles.find(p => p.id === player.profile_id)?.display_name
                            ?? profiles.find(p => p.id === player.profile_id)?.email
                            ?? player.profile_id}
                        </p>
                      )}
                    </div>

                    {/* Foto upload desde el panel */}
                    <div className="mb-4 p-3" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Foto de perfil</p>
                      <div className="flex items-center gap-4">
                        {/* Preview actual */}
                        <div className="w-16 h-20 bg-gray-900 flex-shrink-0 overflow-hidden relative">
                          {player.photo_url ? (
                            <Image src={player.photo_url} alt={player.name} fill className="object-cover object-top" sizes="64px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-title text-lg" style={{ color: '#D4186C44' }}>{getInitials(player.name)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            className="inline-flex items-center gap-2 cursor-pointer font-title text-sm tracking-wider uppercase px-4 py-2 transition-colors"
                            style={{
                              border: '1px solid #D4186C',
                              color: '#D4186C',
                              background: 'transparent',
                            }}
                          >
                            {uploadingId === player.id ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <Camera size={14} />
                                {player.photo_url ? 'Cambiar foto' : 'Subir foto'}
                              </>
                            )}
                            <input
                              type="file" accept="image/*" className="hidden"
                              disabled={uploadingId !== null}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handlePhotoUpload(player.id, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <p className="text-gray-700 text-xs mt-1">JPG, PNG · máx 8MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button" variant="pink" size="sm"
                        loading={isPending}
                        onClick={() => handleSaveEdit(player.id)}
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
        ))}
      </div>
    </div>
  )
}
