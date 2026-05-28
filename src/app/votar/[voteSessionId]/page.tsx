import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { VoteForm } from '@/components/voting/VoteForm'
import { VOTE_TYPE_LABELS } from '@/types'
import type { Player, VoteSession } from '@/types'

export const revalidate = 0

interface Props {
  params: Promise<{ voteSessionId: string }>
}

export default async function VotarSessionPage({ params }: Props) {
  const { voteSessionId } = await params
  const supabase = await createClient()
  const profile = await getProfile()

  // Redirigir a login si no está autenticado
  if (!profile) {
    redirect(`/login?redirectTo=/votar/${voteSessionId}`)
  }

  // Obtener sesión de votación
  const { data: session } = await supabase
    .from('vote_sessions')
    .select('*, season:seasons(*)')
    .eq('id', voteSessionId)
    .single()

  if (!session) notFound()

  // Solo sesiones abiertas
  if (session.status !== 'open') {
    if (session.status === 'published') {
      redirect(`/resultado/${voteSessionId}`)
    }
    redirect('/votar')
  }

  // Verificar si ya votó
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('vote_session_id', voteSessionId)
    .eq('voter_id', profile.id)
    .single()

  const hasVoted = !!existingVote

  // Si es votación de jugadoras, verificar que sea jugadora
  if (session.voter_type === 'players' && profile.role !== 'player' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black">
        <Header profile={profile} />
        <main className="pt-14 px-4">
          <div className="max-w-screen-sm mx-auto py-20 text-center">
            <span className="text-5xl block mb-4">🐍</span>
            <h2 className="font-title text-2xl text-white mb-2">Esta votación es solo para jugadoras</h2>
            <p className="text-gray-500 text-sm">Contactá al admin si creés que es un error.</p>
          </div>
        </main>
      </div>
    )
  }

  // Obtener jugadoras en placa (o todas según tipo)
  let playersQuery = supabase
    .from('players')
    .select('*')
    .eq('season_id', session.season_id)
    .neq('status', 'eliminated')
    .order('sort_order', { ascending: true })

  // Para nominaciones, solo jugadoras en placa
  if (session.type.includes('negative') || session.type === 'internal_nomination') {
    const { data: nominations } = await supabase
      .from('nominations')
      .select('player_id')
      .eq('season_id', session.season_id)
      .eq('is_active', true)

    if (nominations && nominations.length > 0) {
      const nominatedIds = nominations.map((n) => n.player_id)
      playersQuery = supabase
        .from('players')
        .select('*')
        .in('id', nominatedIds)
        .order('sort_order', { ascending: true })
    }
  }

  const { data: players } = await playersQuery

  // Excluir al jugador votante (si es jugadora)
  const filteredPlayers = (players ?? []).filter((p: Player) =>
    p.profile_id !== profile.id
  )

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />

      <main className="pt-14 px-4 pb-12">
        <div className="max-w-screen-sm mx-auto">
          {/* Header */}
          <div className="py-8 text-center">
            <p className="font-title text-xs text-pink/60 tracking-[0.4em] uppercase mb-2">
              {VOTE_TYPE_LABELS[session.type as keyof typeof VOTE_TYPE_LABELS]}
            </p>
            <h1
              className="font-title text-4xl text-white leading-tight"
              style={{ textShadow: '0 0 20px #D4186C44' }}
            >
              {session.title}
            </h1>
            {session.description && (
              <p className="text-gray-500 text-sm mt-2">{session.description}</p>
            )}
          </div>

          <VoteForm
            session={session as VoteSession}
            players={filteredPlayers as Player[]}
            profile={profile}
            hasVoted={hasVoted}
          />
        </div>
      </main>
    </div>
  )
}
