import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { VOTE_TYPE_LABELS } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import type { VoteSession } from '@/types'

export const revalidate = 30

export default async function VotarPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const { data: sessions } = await supabase
    .from('vote_sessions')
    .select('*, season:seasons(name)')
    .in('status', ['open', 'published'])
    .order('created_at', { ascending: false })

  const open = (sessions ?? []).filter((s: VoteSession) => s.status === 'open')
  const published = (sessions ?? []).filter((s: VoteSession) => s.status === 'published')

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />

      <main className="pt-14 px-4 pb-12">
        <div className="max-w-screen-sm mx-auto">
          {/* Header */}
          <div className="text-center py-10">
            <p className="font-title text-pink/60 text-xs tracking-[0.5em] uppercase mb-1">
              Tu voz importa
            </p>
            <h1
              className="font-title text-5xl text-white"
              style={{ textShadow: '0 0 20px #D4186C44' }}
            >
              Votaciones
            </h1>
          </div>

          {/* Votaciones abiertas */}
          {open.length > 0 ? (
            <section className="mb-8">
              <p className="font-title text-xs tracking-[0.4em] text-pink uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
                Abiertas ahora
              </p>
              <div className="space-y-3">
                {open.map((session: VoteSession & { season?: { name: string } }) => (
                  <Link key={session.id} href={`/votar/${session.id}`}>
                    <div
                      className="p-5 rounded-sm transition-all duration-200 hover:border-pink/60 active:scale-98"
                      style={{
                        background: '#1a0a14',
                        border: '1px solid #D4186C66',
                        boxShadow: '0 0 20px #D4186C22',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="pink" className="text-[10px]">
                              {VOTE_TYPE_LABELS[session.type]}
                            </Badge>
                            {session.voter_type === 'players' && (
                              <Badge variant="outline" className="text-[10px]">
                                Solo jugadoras
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-title text-xl text-white mt-2">
                            {session.title}
                          </h3>
                          {session.description && (
                            <p className="text-gray-500 text-xs mt-1">{session.description}</p>
                          )}
                          {session.end_time && (
                            <p className="text-gray-600 text-xs mt-2">
                              Cierra: {formatDate(session.end_time)} · {formatTime(session.end_time)}
                            </p>
                          )}
                        </div>
                        <span className="font-title text-pink text-2xl mt-1">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div
              className="text-center py-12 rounded-sm mb-8"
              style={{ border: '1px solid #2a2a2a' }}
            >
              <span className="text-5xl block mb-3">🐍</span>
              <p className="font-title text-xl text-gray-600">No hay votaciones abiertas</p>
              <p className="text-gray-700 text-sm mt-1">Volvé pronto</p>
            </div>
          )}

          {/* Resultados publicados */}
          {published.length > 0 && (
            <section>
              <p className="font-title text-xs tracking-[0.4em] text-gray-600 uppercase mb-4">
                Resultados
              </p>
              <div className="space-y-2">
                {published.map((session: VoteSession) => (
                  <Link key={session.id} href={`/resultado/${session.id}`}>
                    <div
                      className="p-4 rounded-sm transition-all hover:border-gray-700"
                      style={{ background: '#111', border: '1px solid #2a2a2a' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-title text-base text-gray-400">{session.title}</p>
                          <p className="text-gray-700 text-xs mt-0.5">
                            {VOTE_TYPE_LABELS[session.type]}
                          </p>
                        </div>
                        <span className="text-gray-700 font-title">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Login prompt */}
          {!profile && open.length > 0 && (
            <div className="mt-8 p-4 text-center border border-gray-800 rounded-sm bg-gray-900/50">
              <p className="text-gray-400 text-sm mb-3">
                Necesitás ingresar para votar
              </p>
              <Link
                href="/login?redirectTo=/votar"
                className="inline-block btn-pink text-sm px-6 py-2"
              >
                Ingresar
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
