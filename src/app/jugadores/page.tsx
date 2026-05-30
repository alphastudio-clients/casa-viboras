import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { PlayerCard } from '@/components/players/PlayerCard'
import { SnakeDivider, ClawMarks } from '@/components/ui/GlowText'

export const revalidate = 60

export default async function JugadorasPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .single()

  const { data: players } = season
    ? await supabase
        .from('players')
        .select('*')
        .eq('season_id', season.id)
        .order('sort_order', { ascending: true })
    : { data: [] }

  const all = players ?? []
  const active = all.filter((p) => p.status === 'active')
  const nominated = all.filter((p) => p.status === 'nominated')
  const leaders = all.filter((p) => p.status === 'leader')
  const eliminated = all.filter((p) => p.status === 'eliminated')

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />

      <main className="pt-14 px-4 pb-12">
        <div className="max-w-screen-sm mx-auto">
          {/* Header estilo flyer */}
          <div className="relative text-center py-10 overflow-hidden">
            <ClawMarks opacity={0.1} />
            <div className="relative z-10">
              <p className="font-title text-xs tracking-[0.55em] uppercase mb-2 inline-block px-3 py-0.5"
                style={{ color: '#D4186C', border: '1px solid #D4186C44' }}>
                {season?.name ?? 'La Casa de Víboras'}
              </p>
              <h1
                className="font-title leading-none block"
                style={{
                  fontSize: 'clamp(3rem, 14vw, 5.5rem)',
                  textShadow: '0 0 30px #D4186C55',
                  color: 'white',
                }}
              >
                LES JUGADORES
              </h1>
              <p className="text-gray-600 text-xs mt-2 tracking-widest uppercase">
                {all.length} jugadores · {eliminated.length} eliminados
              </p>
            </div>
          </div>

          {!season && (
            <div className="text-center py-20 text-gray-700">
              <div className="flex justify-center mb-3">
                <Image
                  src="/logo-viboras.png"
                  alt=""
                  width={64}
                  height={64}
                  style={{ filter: 'drop-shadow(0 0 20px #D4186C88)' }}
                />
              </div>
              <p className="font-title text-xl">La temporada aún no comenzó</p>
            </div>
          )}

          {/* Líderes */}
          {leaders.length > 0 && (
            <section className="mb-8">
              <p className="font-title text-pink/80 tracking-[0.3em] text-sm uppercase mb-3">
                👑 Líder
              </p>
              <div className="grid grid-cols-2 gap-3">
                {leaders.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}
              </div>
            </section>
          )}

          {/* Nominadas */}
          {nominated.length > 0 && (
            <section className="mb-8">
              <SnakeDivider />
              <p className="font-title text-yellow-400/80 tracking-[0.3em] text-sm uppercase mb-3">
                🎯 En placa
              </p>
              <div className="grid grid-cols-2 gap-3">
                {nominated.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}
              </div>
            </section>
          )}

          {/* Activas */}
          {active.length > 0 && (
            <section className="mb-8">
              <SnakeDivider />
              <p className="font-title text-gray-400 tracking-[0.3em] text-sm uppercase mb-3 flex items-center gap-2">
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
                {active.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}
              </div>
            </section>
          )}

          {/* Eliminadas */}
          {eliminated.length > 0 && (
            <section className="mb-8">
              <SnakeDivider />
              <p className="font-title text-gray-600 tracking-[0.3em] text-sm uppercase mb-3">
                Abandonaron la casa
              </p>
              <div className="grid grid-cols-3 gap-2">
                {eliminated.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
