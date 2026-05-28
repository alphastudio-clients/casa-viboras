'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createSeason, updateSeasonStatus } from '@/app/actions/admin'
import { slugify } from '@/lib/utils'
import type { Season } from '@/types'

const STATUS_CONFIG = {
  upcoming: { label: 'Próxima', color: 'text-blue-400 border-blue-800' },
  active:   { label: 'Activa',  color: 'text-green-400 border-green-800' },
  finished: { label: 'Finalizada', color: 'text-gray-600 border-gray-700' },
}

export function AdminTemporadasClient({ seasons: initial }: { seasons: Season[] }) {
  const [seasons, setSeasons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', edition: '', description: '' })

  function handleNameChange(name: string) {
    setForm({ ...form, name })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createSeason({
        name: form.name,
        slug: slugify(form.name),
        description: form.description || undefined,
        edition: form.edition || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.season) {
        setSeasons((prev) => [result.season!, ...prev])
        setForm({ name: '', edition: '', description: '' })
        setShowForm(false)
      }
    })
  }

  async function handleStatusChange(seasonId: string, status: 'upcoming' | 'active' | 'finished') {
    startTransition(async () => {
      await updateSeasonStatus(seasonId, status)
      setSeasons((prev) => prev.map((s) => s.id === seasonId ? { ...s, status } : s))
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm((v) => !v)} variant="outline" size="sm" className="flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva temporada'}
        </Button>
      </div>

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
            <h3 className="font-title text-lg text-white mb-4">Nueva temporada</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                  required placeholder="La Casa de Víboras 2026"
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none placeholder:text-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Edición</label>
                <input type="text" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  placeholder="2026, Córdoba..."
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none placeholder:text-gray-700" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1">Descripción</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción de la temporada"
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2.5 rounded-sm focus:outline-none placeholder:text-gray-700" />
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button type="submit" variant="pink" size="sm" loading={isPending}>Crear temporada</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {seasons.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            <p className="font-title text-xl">Sin temporadas aún</p>
          </div>
        )}
        {seasons.map((season) => {
          const cfg = STATUS_CONFIG[season.status]
          return (
            <div key={season.id} className="p-4 rounded-sm" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-title text-xl text-white">{season.name}</h3>
                  {season.edition && <p className="text-gray-600 text-xs">Edición: {season.edition}</p>}
                  {season.description && <p className="text-gray-500 text-sm mt-1">{season.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`font-title text-xs uppercase px-2 py-0.5 border ${cfg.color}`}>{cfg.label}</span>
                  <select
                    value={season.status}
                    onChange={(e) => handleStatusChange(season.id, e.target.value as 'upcoming' | 'active' | 'finished')}
                    disabled={isPending}
                    className="bg-gray-900 border border-gray-700 text-gray-400 text-xs p-1 rounded-sm focus:outline-none cursor-pointer"
                  >
                    <option value="upcoming">Próxima</option>
                    <option value="active">Activa</option>
                    <option value="finished">Finalizada</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
