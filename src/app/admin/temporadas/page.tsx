import { createClient } from '@/lib/supabase/server'
import { AdminTemporadasClient } from '@/components/admin/AdminTemporadasClient'

export default async function AdminTemporadasPage() {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-title text-4xl text-white mb-1">Temporadas</h1>
        <p className="text-gray-600 text-sm">{seasons?.length ?? 0} temporadas</p>
      </div>
      <AdminTemporadasClient seasons={seasons ?? []} />
    </div>
  )
}
