import { createClient } from '@/lib/supabase/server'
import { AdminResultsClient } from '@/components/admin/AdminResultsClient'

export default async function AdminResultadosPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('vote_sessions')
    .select('*, season:seasons(name)')
    .in('status', ['closed', 'published'])
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-title text-4xl text-white mb-1">Resultados</h1>
        <p className="text-gray-600 text-sm">Solo vos podés ver esto</p>
      </div>

      <AdminResultsClient sessions={sessions ?? []} />
    </div>
  )
}
