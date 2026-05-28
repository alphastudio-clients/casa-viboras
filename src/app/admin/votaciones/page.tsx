import { createClient } from '@/lib/supabase/server'
import { AdminVotacionesClient } from '@/components/admin/AdminVotacionesClient'

export default async function AdminVotacionesPage() {
  const supabase = await createClient()

  const [{ data: sessions }, { data: seasons }] = await Promise.all([
    supabase
      .from('vote_sessions')
      .select('*, season:seasons(name)')
      .order('created_at', { ascending: false }),
    supabase.from('seasons').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-title text-4xl text-white mb-1">Votaciones</h1>
        <p className="text-gray-600 text-sm">{sessions?.length ?? 0} votaciones</p>
      </div>

      <AdminVotacionesClient sessions={sessions ?? []} seasons={seasons ?? []} />
    </div>
  )
}
