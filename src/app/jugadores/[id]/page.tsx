import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, ArrowLeft, Award, Target, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { SnakeDivider } from '@/components/ui/GlowText'
import { formatDate, getInitials } from '@/lib/utils'

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayerProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile()

  const { data: player } = await supabase
    .from('players')
    .select('*, season:seasons(*)')
    .eq('id', id)
    .single()

  if (!player) notFound()

  const isEliminated = player.status === 'eliminated'
  const stats = player.stats as Record<string, number>
  const clips = player.clips as Array<{ title: string; url: string }>

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />

      <main className="pt-14">
        {/* Foto hero */}
        <div className="relative h-[55vh] max-h-96 overflow-hidden">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              className={`object-cover object-top ${isEliminated ? 'grayscale opacity-60' : ''}`}
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <span className="font-title text-[8rem] text-pink/20">
                {getInitials(player.name)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          {/* Back */}
          <Link
            href="/jugadores"
            className="absolute top-4 left-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-title text-sm tracking-wider uppercase">Jugadoras</span>
          </Link>
        </div>

        {/* Contenido */}
        <div className="px-4 pb-12 max-w-screen-sm mx-auto -mt-8 relative z-10">
          {/* Nombre y status */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h1
                  className="font-title text-5xl text-white leading-none"
                  style={!isEliminated ? { textShadow: '0 0 20px #D4186C44' } : {}}
                >
                  {player.name}
                </h1>
                {player.nickname && (
                  <p className="text-pink/70 font-mono text-sm mt-1">
                    &ldquo;{player.nickname}&rdquo;
                  </p>
                )}
              </div>
              <StatusBadge status={player.status} className="mt-1 flex-shrink-0" />
            </div>

            {player.instagram_handle && (
              <a
                href={`https://instagram.com/${player.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-pink transition-colors text-sm"
              >
                <Instagram size={14} />
                @{player.instagram_handle}
              </a>
            )}
          </div>

          {/* Frase destacada */}
          {player.highlight_phrase && (
            <blockquote className="border-l-2 border-pink pl-4 mb-6">
              <p className="text-gray-300 italic text-base leading-relaxed">
                &ldquo;{player.highlight_phrase}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Descripción */}
          {player.description && (
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {player.description}
            </p>
          )}

          <SnakeDivider />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-gray-900 border border-gray-800 rounded-sm">
              <Award size={16} className="text-pink mx-auto mb-1" />
              <p className="font-title text-2xl text-white">{stats.weeks_leader ?? 0}</p>
              <p className="text-gray-600 text-xs uppercase tracking-wider">Líder</p>
            </div>
            <div className="text-center p-3 bg-gray-900 border border-gray-800 rounded-sm">
              <Target size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="font-title text-2xl text-white">{stats.nominations ?? 0}</p>
              <p className="text-gray-600 text-xs uppercase tracking-wider">Nominaciones</p>
            </div>
            <div className="text-center p-3 bg-gray-900 border border-gray-800 rounded-sm">
              <Users size={16} className="text-gray-400 mx-auto mb-1" />
              <p className="font-title text-2xl text-white">{stats.votes_received ?? 0}</p>
              <p className="text-gray-600 text-xs uppercase tracking-wider">Votos</p>
            </div>
          </div>

          {/* Fechas */}
          <div className="text-xs text-gray-600 space-y-1 mb-6">
            {player.entry_date && (
              <p>Entró: <span className="text-gray-500">{formatDate(player.entry_date)}</span></p>
            )}
            {player.elimination_date && (
              <p>Eliminada: <span className="text-gray-500">{formatDate(player.elimination_date)}</span></p>
            )}
          </div>

          {/* Clips */}
          {clips.length > 0 && (
            <section>
              <SnakeDivider />
              <h2 className="font-title text-xl text-white mb-3">Clips destacados</h2>
              <div className="space-y-2">
                {clips.map((clip, i) => (
                  <a
                    key={i}
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 hover:border-pink/40 transition-colors rounded-sm"
                  >
                    <span className="text-pink">▶</span>
                    <span className="text-sm text-gray-300">{clip.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Temporada */}
          {player.season && (
            <div className="mt-6 text-center">
              <Link
                href="/casa"
                className="text-gray-700 text-xs hover:text-gray-500 transition-colors uppercase tracking-wider font-title"
              >
                {player.season.name} →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
