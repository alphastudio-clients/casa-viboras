'use server'

import { createClient } from '@/lib/supabase/server'
import type { CastVoteInput } from '@/types'

export async function castVote(input: CastVoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Necesitás ingresar para votar.' }

  // Verificar que la sesión existe y está abierta
  const { data: session } = await supabase
    .from('vote_sessions')
    .select('id, status, voter_type, season_id')
    .eq('id', input.vote_session_id)
    .single()

  if (!session) return { error: 'La votación no existe.' }
  if (session.status !== 'open') return { error: 'Esta votación ya no está abierta.' }

  // Verificar que el jugador target existe y no está eliminado
  const { data: targetPlayer } = await supabase
    .from('players')
    .select('id, status')
    .eq('id', input.target_player_id)
    .single()

  if (!targetPlayer) return { error: 'Jugadora no encontrada.' }
  if (targetPlayer.status === 'eliminated') return { error: 'No podés votar a una jugadora eliminada.' }

  // Si es votación de jugadoras, verificar perfil
  if (session.voter_type === 'players') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'player' && profile?.role !== 'admin') {
      return { error: 'Esta votación es solo para jugadoras.' }
    }
  }

  // Verificar que no votó antes (doble protección además del UNIQUE constraint)
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('vote_session_id', input.vote_session_id)
    .eq('voter_id', user.id)
    .single()

  if (existing) return { error: 'Ya votaste en esta votación.' }

  // Insertar voto
  const { error } = await supabase.from('votes').insert({
    vote_session_id: input.vote_session_id,
    voter_id: user.id,
    target_player_id: input.target_player_id,
    reason: input.reason ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya votaste en esta votación.' }
    console.error('Vote error:', error)
    return { error: 'No se pudo registrar el voto. Intentá de nuevo.' }
  }

  return { success: true }
}
