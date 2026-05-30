import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile } from '@/lib/auth/utils'
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

  // Necesitamos usuario (anónimo o autenticado), no necesariamente perfil
  const user = await getUser()
  if (!user) {
    redirect(`/login?redirectTo=/votar/${voteSessionId}`)
  }

  // Perfil puede ser null para usuarios anónimos
  const profile = await getProfile()

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

  // Si es votación de jugadoras, verificar que sea jugadora con cuenta vinculada
  if (session.voter_type === 'players') {
    if (!profile || (profile.role !== 'player' && profile.role !== 'admin')) {
      return (
        <div className="min-h-screen bg-black">
          <Header profile={profile} />
          <main className="pt-14 px-4">
            <div className="max-w-screen-sm mx-auto py-20 text-center">
              <div className="flex justify-center mb-4">
                <Image
                  src="/logo-viboras.png"
                  alt=""
                  width={64}
                  height={64}
                  style={{ filter: 'drop-shadow(0 0 20px #D4186C88)' }}
                />
              </div>
              <h2 className="font-title text-2xl text-white mb-2">
                Esta votación es solo para jugadores
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Necesitás ingresar con la cuenta de Google vinculada a tu perfil de jugador.
              </p>
              <a
                href={`/login?redirectTo=/votar/${voteSessionId}`}
                className="inline-block font-title text-sm tracking-widest uppercase px-6 py-3"
                style={{ background: '#D4186C', color: 'black' }}
              >
                Ingresar con Google
              </a>
            </div>
          </main>
        </div>
      )
    }
  }

  // Verificar si ya votó (usando user.id directamente, funciona para anónimos y autenticados)
  const { count: voteCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_session_id', voteSessionId)
    .eq('voter_id', user.id)

  const hasVoted = (voteCount ?? 0) > 0

  // Obtener jugadoras
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

  // Excluir al jugador votante (si tiene perfil y está vinculada)
  const filteredPlayers = (players ?? []).filter((p: Player) =>
    !profile || p.profile_id !== profile.id
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
