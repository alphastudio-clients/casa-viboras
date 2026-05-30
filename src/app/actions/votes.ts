'use server'

import { createClient } from '@/lib/supabase/server'
import { VOTE_WEIGHTS } from '@/types'
import type { CastVoteInput, CastMultiVoteInput, VoteType } from '@/types'

// ── voto único (para todos los tipos que NO son multi-pick) ──
export async function castVote(input: CastVoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Necesitás ingresar para votar.' }

  const { data: session } = await supabase
    .from('vote_sessions')
    .select('id, status, voter_type, season_id')
    .eq('id', input.vote_session_id)
    .single()

  if (!session) return { error: 'La votación no existe.' }
  if (session.status !== 'open') return { error: 'Esta votación ya no está abierta.' }

  const { data: targetPlayer } = await supabase
    .from('players')
    .select('id, status')
    .eq('id', input.target_player_id)
    .single()

  if (!targetPlayer) return { error: 'Jugadora no encontrada.' }
  if (targetPlayer.status === 'eliminated') return { error: 'No podés votar a una jugadora eliminada.' }

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

  // Verificar que no votó antes
  const { count } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_session_id', input.vote_session_id)
    .eq('voter_id', user.id)

  if ((count ?? 0) > 0) return { error: 'Ya votaste en esta votación.' }

  const { error } = await supabase.from('votes').insert({
    vote_session_id: input.vote_session_id,
    voter_id: user.id,
    target_player_id: input.target_player_id,
    points: 1,
    rank: 1,
    reason: input.reason ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya votaste en esta votación.' }
    console.error('[castVote] error:', error.code, error.message)
    return { error: `Error al registrar el voto: ${error.message}` }
  }

  return { success: true }
}

// ── voto múltiple ponderado (nominación / espontánea) ──
export async function castMultiVote(input: CastMultiVoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Necesitás ingresar para votar.' }

  const { data: session } = await supabase
    .from('vote_sessions')
    .select('id, status, voter_type, type, season_id')
    .eq('id', input.vote_session_id)
    .single()

  if (!session) return { error: 'La votación no existe.' }
  if (session.status !== 'open') return { error: 'Esta votación ya no está abierta.' }

  const weights = VOTE_WEIGHTS[session.type as VoteType]
  if (!weights) return { error: 'Este tipo de votación no admite múltiples picks.' }
  if (input.picks.length !== weights.length) {
    return { error: `Necesitás elegir exactamente ${weights.length} jugadoras.` }
  }

  const uniquePicks = new Set(input.picks)
  if (uniquePicks.size !== input.picks.length) {
    return { error: 'No podés nominar a la misma jugadora dos veces.' }
  }

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

  // Verificar que no votó antes
  const { count } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_session_id', input.vote_session_id)
    .eq('voter_id', user.id)

  if ((count ?? 0) > 0) return { error: 'Ya votaste en esta votación.' }

  // Un row por pick con su peso — insertamos todos de una para que sea atómico
  const rows = input.picks.map((playerId, i) => ({
    vote_session_id: input.vote_session_id,
    voter_id: user.id,
    target_player_id: playerId,
    points: weights[i],
    rank: i + 1,
    reason: i === 0 ? (input.reason ?? null) : null,
  }))

  const { error } = await supabase.from('votes').insert(rows)

  if (error) {
    if (error.code === '23505') return { error: 'Ya votaste en esta votación.' }
    // Si algo falló parcialmente, limpiar las filas que pudieron haber quedado
    await supabase
      .from('votes')
      .delete()
      .eq('vote_session_id', input.vote_session_id)
      .eq('voter_id', user.id)
    console.error('[castMultiVote] error:', error.code, error.message)
    return { error: `Error al registrar el voto: ${error.message}` }
  }

  return { success: true }
}
