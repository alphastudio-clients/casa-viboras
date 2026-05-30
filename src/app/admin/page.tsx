import { createClient } from '@/lib/supabase/server'
import { Users, Vote, Trophy, Calendar } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalPlayers },
    { count: activeSessions },
    { count: totalVotes },
    { count: totalSeasons },
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('vote_sessions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('seasons').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Jugadores', value: totalPlayers ?? 0, icon: Users, color: 'text-pink' },
    { label: 'Votaciones abiertas', value: activeSessions ?? 0, icon: Vote, color: 'text-yellow-400' },
    { label: 'Votos totales', value: totalVotes ?? 0, icon: Trophy, color: 'text-green-400' },
    { label: 'Temporadas', value: totalSeasons ?? 0, icon: Calendar, color: 'text-blue-400' },
  ]

  // Últimas votaciones
  const { data: recentSessions } = await supabase
    .from('vote_sessions')
    .select('*, season:seasons(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Últimos votos
  const { data: recentVotes } = await supabase
    .from('votes')
    .select('*, voter:profiles(display_name, email), target_player:players(name)')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-title text-4xl text-white mb-1">Dashboard</h1>
        <p className="text-gray-600 text-sm">Panel de control de La Casa de Víboras</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="p-4 rounded-sm"
            style={{ background: '#111', border: '1px solid #2a2a2a' }}
          >
            <Icon size={18} className={`${color} mb-3`} />
            <p className={`font-title text-3xl ${color}`}>{value}</p>
            <p className="text-gray-600 text-xs uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Últimas votaciones */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a' }} className="rounded-sm p-4">
          <h2 className="font-title text-lg text-white mb-4 tracking-wider">Votaciones recientes</h2>
          {recentSessions?.length === 0 ? (
            <p className="text-gray-700 text-sm">Sin votaciones aún</p>
          ) : (
            <div className="space-y-2">
              {recentSessions?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{s.title}</p>
                    <p className="text-xs text-gray-600">{s.season?.name}</p>
                  </div>
                  <span className={`text-xs font-title uppercase px-2 py-0.5 border ${
                    s.status === 'open' ? 'text-green-400 border-green-800' :
                    s.status === 'published' ? 'text-pink border-pink/40' :
                    'text-gray-600 border-gray-700'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos votos */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a' }} className="rounded-sm p-4">
          <h2 className="font-title text-lg text-white mb-4 tracking-wider">Últimos votos</h2>
          {recentVotes?.length === 0 ? (
            <p className="text-gray-700 text-sm">Sin votos aún</p>
          ) : (
            <div className="space-y-2">
              {recentVotes?.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">
                      {v.voter?.display_name ?? v.voter?.email ?? 'Anónimo'}
                    </p>
                    <p className="text-xs text-gray-600">→ {v.target_player?.name}</p>
                  </div>
                  <p className="text-xs text-gray-700 flex-shrink-0 ml-2">
                    {new Date(v.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
