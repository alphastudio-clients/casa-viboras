import { createClient } from '@/lib/supabase/server'
import { AdminPlayersClient } from '@/components/admin/AdminPlayersClient'
import type { Profile } from '@/types'

export default async function AdminJugadorasPage() {
  const supabase = await createClient()

  const [{ data: seasons }, { data: players }, { data: profiles }] = await Promise.all([
    supabase.from('seasons').select('*').order('created_at', { ascending: false }),
    supabase.from('players').select('*, season:seasons(name)').order('sort_order', { ascending: true }),
    supabase.from('profiles').select('id, email, display_name, role, player_id').order('display_name', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-4xl text-white mb-1">Jugadoras</h1>
          <p className="text-gray-600 text-sm">{players?.length ?? 0} jugadoras en total</p>
        </div>
      </div>

      <AdminPlayersClient
        players={players ?? []}
        seasons={seasons ?? []}
        profiles={(profiles ?? []) as Profile[]}
      />
    </div>
  )
}
