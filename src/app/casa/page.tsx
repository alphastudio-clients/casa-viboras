import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { PlayerCard } from '@/components/players/PlayerCard'
import { SnakeDivider, ClawMarks } from '@/components/ui/GlowText'
import type { Player, VoteSession } from '@/types'

export const revalidate = 60

async function getData() {
  const supabase = await createClient()

  const [{ data: seasons }, { data: activeSessions }] = await Promise.all([
    supabase
      .from('seasons')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('vote_sessions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
  ])

  const activeSeason = seasons?.[0]
  let players: Player[] = []

  if (activeSeason) {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('season_id', activeSeason.id)
      .order('sort_order', { ascending: true })
    players = data ?? []
  }

  return { season: activeSeason, players, activeSessions: activeSessions ?? [] }
}

export default async function CasaPage() {
  const [{ season, players, activeSessions }, profile] = await Promise.all([
    getData(),
    getProfile(),
  ])

  const activePlayers = players.filter((p) => p.status !== 'eliminated')
  const eliminatedPlayers = players.filter((p) => p.status === 'eliminated')
  const nominatedPlayers = players.filter((p) => p.status === 'nominated')
  const leaders = players.filter((p) => p.status === 'leader')

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />

      <main className="pt-14">
        {/* Hero — estilo flyer */}
        <section className="relative px-4 pt-10 pb-12 text-center overflow-hidden">
          {/* Fondo radial */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #D4186C11 0%, transparent 70%)'
          }} />
          {/* Garras */}
          <ClawMarks opacity={0.12} />

          {/* Línea top y bottom */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4186C88, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4186C44, transparent)' }} />

          <div className="relative z-10 max-w-lg mx-auto">
            {/* Edición */}
            <p
              className="font-title text-xs tracking-[0.6em] mb-3 uppercase inline-block px-4 py-1"
              style={{
                color: '#D4186C',
                border: '1px solid #D4186C44',
                boxShadow: '0 0 10px #D4186C22',
              }}
            >
              {season?.edition ?? '2026'}
            </p>

            {/* Título grande tipo flyer */}
            <h1
              className="font-title text-white leading-none block"
              style={{
                fontSize: 'clamp(3.5rem, 16vw, 7rem)',
                textShadow: '0 0 40px #D4186C44',
                letterSpacing: '0.02em',
              }}
            >
              {season?.name ?? 'LA CASA DE VÍBORAS'}
            </h1>

            {/* Sub-recuadro "VÍBORAS ROSAS" */}
            <div className="flex items-center justify-center gap-3 mt-3 mb-2">
              <div className="flex-1 max-w-[60px] h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4186C)' }} />
              <span
                className="font-title text-sm tracking-[0.4em] uppercase"
                style={{ color: '#D4186C', textShadow: '0 0 10px #D4186C88' }}
              >
                VÍBORAS ROSAS
              </span>
              <div className="flex-1 max-w-[60px] h-px" style={{ background: 'linear-gradient(90deg, #D4186C, transparent)' }} />
            </div>

            {season?.description && (
              <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                {season.description}
              </p>
            )}

            {!season && (
              <p className="text-gray-600 text-sm mt-4 font-title tracking-widest">
                LA TEMPORADA COMENZARÁ PRONTO
              </p>
            )}
          </div>
        </section>

        {/* Votación activa — banner estilo flyer */}
        {activeSessions.length > 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-screen-sm mx-auto space-y-3">
              {activeSessions.map((session: VoteSession) => (
                <Link key={session.id} href={`/votar/${session.id}`} className="block group">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #1a0a14 0%, #0d0008 100%)',
                      border: '2px solid #D4186C',
                      boxShadow: '0 0 30px #D4186C44, inset 0 0 20px #D4186C08',
                    }}
                  >
                    <ClawMarks opacity={0.1} />
                    {/* Barra top animada */}
                    <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #D4186C, #E8005A, #D4186C)' }} />
                    <div className="relative z-10 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-title text-xs tracking-[0.4em] uppercase mb-1 flex items-center gap-2"
                          style={{ color: '#D4186C' }}>
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          VOTACIÓN ABIERTA
                        </p>
                        <h3 className="font-title text-2xl text-white leading-tight">
                          {session.title}
                        </h3>
                        {session.description && (
                          <p className="text-gray-500 text-xs mt-1">{session.description}</p>
                        )}
                      </div>
                      <span
                        className="font-title text-3xl flex-shrink-0 group-hover:translate-x-1 transition-transform"
                        style={{ color: '#D4186C' }}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Líderes */}
        {leaders.length > 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-screen-sm mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-title text-pink tracking-[0.3em] text-sm uppercase">
                  👑 Líder de la semana
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {leaders.map((p, i) => (
                  <PlayerCard key={p.id} player={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* En placa */}
        {nominatedPlayers.length > 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-screen-sm mx-auto">
              <SnakeDivider />
              <p className="font-title text-yellow-400/80 tracking-[0.3em] text-sm uppercase mb-4">
                🎯 En placa
              </p>
              <div className="grid grid-cols-2 gap-3">
                {nominatedPlayers.map((p, i) => (
                  <PlayerCard key={p.id} player={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Jugadoras activas */}
        {activePlayers.length > 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-screen-sm mx-auto">
              <SnakeDivider />
              <p className="font-title text-gray-400 tracking-[0.3em] text-sm uppercase mb-4 flex items-center gap-2">
                <Image
                  src="/logo-viboras.png"
                  alt=""
                  width={16}
                  height={16}
                  style={{ filter: 'drop-shadow(0 0 6px #D4186C88)' }}
                />
                En la casa
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activePlayers
                  .filter((p) => p.status === 'active')
                  .map((p, i) => (
                    <PlayerCard key={p.id} player={p} index={i} />
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Eliminadas */}
        {eliminatedPlayers.length > 0 && (
          <section className="px-4 mb-12">
            <div className="max-w-screen-sm mx-auto">
              <SnakeDivider />
              <p className="font-title text-gray-600 tracking-[0.3em] text-sm uppercase mb-4">
                Abandonaron la casa
              </p>
              <div className="grid grid-cols-3 gap-2">
                {eliminatedPlayers.map((p, i) => (
                  <PlayerCard key={p.id} player={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {!season && (
          <div className="text-center py-20 text-gray-700">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo-viboras.png"
                alt=""
                width={72}
                height={72}
                style={{ filter: 'drop-shadow(0 0 24px #D4186C88)' }}
              />
            </div>
            <p className="font-title text-2xl">La casa está en silencio</p>
            <p className="text-sm mt-2">La temporada comenzará pronto</p>
          </div>
        )}
      </main>
    </div>
  )
}
