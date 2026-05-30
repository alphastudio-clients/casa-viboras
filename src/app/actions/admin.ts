'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/utils'
import { revalidatePath } from 'next/cache'
import type {
  PlayerStatus,
  CreatePlayerInput,
  CreateVoteSessionInput,
  VoteSessionStatus,
  VoteType,
  VoterType,
} from '@/types'

// ============================================================
// PLAYERS
// ============================================================

export async function createPlayer(input: CreatePlayerInput) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      season_id: input.season_id,
      name: input.name,
      nickname: input.nickname || null,
      description: input.description || null,
      highlight_phrase: input.highlight_phrase || null,
      instagram_handle: input.instagram_handle || null,
      status: input.status ?? 'active',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  revalidatePath('/jugadores')
  return { player }
}

export async function updatePlayer(
  playerId: string,
  data: {
    name?: string
    nickname?: string
    description?: string
    highlight_phrase?: string
    instagram_handle?: string
  }
) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('players')
    .update({
      name: data.name,
      nickname: data.nickname || null,
      description: data.description || null,
      highlight_phrase: data.highlight_phrase || null,
      instagram_handle: data.instagram_handle || null,
    })
    .eq('id', playerId)

  if (error) return { error: error.message }
  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  revalidatePath('/jugadores')
  return { success: true }
}

export async function uploadPlayerPhoto(formData: FormData) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const file = formData.get('photo') as File
  const playerId = formData.get('playerId') as string

  if (!file || !playerId) return { error: 'Faltan datos' }
  if (file.size > 8 * 1024 * 1024) return { error: 'La foto no puede superar 8MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${playerId}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('jugadores')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: `Storage: ${uploadError.message}` }

  const { data: { publicUrl } } = supabase.storage
    .from('jugadores')
    .getPublicUrl(filename)

  const { error: updateError } = await supabase
    .from('players')
    .update({ photo_url: publicUrl })
    .eq('id', playerId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  revalidatePath('/jugadores')
  return { success: true, url: publicUrl }
}

export async function linkPlayerToProfile(playerId: string, profileId: string | null) {
  await requireAdmin()
  const supabase = await createAdminClient()

  // Si había una profile vinculada antes, quitarle el rol de jugadora
  const { data: player } = await supabase
    .from('players')
    .select('profile_id')
    .eq('id', playerId)
    .single()

  if (player?.profile_id && player.profile_id !== profileId) {
    await supabase
      .from('profiles')
      .update({ role: 'public', player_id: null })
      .eq('id', player.profile_id)
  }

  // Actualizar el player
  const { error } = await supabase
    .from('players')
    .update({ profile_id: profileId })
    .eq('id', playerId)

  if (error) return { error: error.message }

  // Actualizar el profile nuevo
  if (profileId) {
    await supabase
      .from('profiles')
      .update({ role: 'player', player_id: playerId })
      .eq('id', profileId)
  }

  revalidatePath('/admin/jugadores')
  return { success: true }
}

export async function linkPlayerByEmail(playerId: string, email: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, player_id')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (profileError || !profile) {
    return { error: 'No se encontró ningún usuario con ese email. Debe haber iniciado sesión al menos una vez.' }
  }

  // Si la profile ya está vinculada a otra jugadora, desvinculamos (sin tocar admins)
  const { data: player } = await supabase
    .from('players')
    .select('profile_id')
    .eq('id', playerId)
    .single()

  if (player?.profile_id && player.profile_id !== profile.id) {
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', player.profile_id)
      .single()
    // Solo resetear si no es admin
    if (oldProfile?.role !== 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'public', player_id: null })
        .eq('id', player.profile_id)
    }
  }

  const { error } = await supabase
    .from('players')
    .update({ profile_id: profile.id })
    .eq('id', playerId)

  if (error) return { error: error.message }

  // No bajar el rol si ya es admin
  const newRole = profile.role === 'admin' ? 'admin' : 'player'
  await supabase
    .from('profiles')
    .update({ role: newRole, player_id: playerId })
    .eq('id', profile.id)

  revalidatePath('/admin/jugadores')
  return { success: true, profileId: profile.id }
}

export async function updatePlayerStatus(playerId: string, status: PlayerStatus) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'eliminated') {
    updateData.elimination_date = new Date().toISOString()
  }

  const { error } = await supabase
    .from('players')
    .update(updateData)
    .eq('id', playerId)

  if (error) return { error: error.message }
  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  revalidatePath('/jugadores')
  return { success: true }
}

export async function deletePlayer(playerId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) return { error: error.message }

  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  return { success: true }
}

// ============================================================
// SEASONS
// ============================================================

export async function createSeason(data: {
  name: string
  slug: string
  description?: string
  edition?: string
}) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: season, error } = await supabase
    .from('seasons')
    .insert({ ...data, status: 'upcoming' })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/temporadas')
  return { season }
}

export async function updateSeasonStatus(seasonId: string, status: 'upcoming' | 'active' | 'finished') {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('seasons')
    .update({ status })
    .eq('id', seasonId)

  if (error) return { error: error.message }
  revalidatePath('/admin/temporadas')
  revalidatePath('/casa')
  return { success: true }
}

// ============================================================
// VOTE SESSIONS
// ============================================================

export async function createVoteSession(input: CreateVoteSessionInput) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: session, error } = await supabase
    .from('vote_sessions')
    .insert({
      season_id: input.season_id,
      title: input.title,
      description: input.description || null,
      type: input.type,
      voter_type: input.voter_type,
      allows_reason: input.allows_reason ?? false,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/votaciones')
  return { session }
}

export async function updateVoteSession(
  sessionId: string,
  data: {
    title?: string
    description?: string
    type?: VoteType
    voter_type?: VoterType
  }
) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('vote_sessions')
    .update({
      title: data.title,
      description: data.description || null,
      type: data.type,
      voter_type: data.voter_type,
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath('/admin/votaciones')
  revalidatePath('/votar')
  return { success: true }
}

export async function updateVoteSessionStatus(sessionId: string, status: VoteSessionStatus) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'published') {
    updateData.published_at = new Date().toISOString()
    updateData.results_visible = true
  }

  const { error } = await supabase
    .from('vote_sessions')
    .update(updateData)
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath('/admin/votaciones')
  revalidatePath('/admin/resultados')
  revalidatePath('/votar')
  return { success: true }
}

export async function setVoteWinner(sessionId: string, winnerPlayerId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('vote_sessions')
    .update({ winner_player_id: winnerPlayerId })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function resetVoteSession(sessionId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error: deleteError } = await supabase
    .from('votes')
    .delete()
    .eq('vote_session_id', sessionId)

  if (deleteError) return { error: deleteError.message }

  const { error } = await supabase
    .from('vote_sessions')
    .update({ status: 'draft', winner_player_id: null, published_at: null, results_visible: false })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath('/admin/votaciones')
  revalidatePath('/admin/resultados')
  return { success: true }
}

// ============================================================
// RESULTS (admin only)
// ============================================================

export async function getVoteResults(sessionId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  // Traer votos con puntos
  const { data: votes } = await supabase
    .from('votes')
    .select('target_player_id, voter_id, voter:profiles(display_name, email), created_at, reason, points, rank')
    .eq('vote_session_id', sessionId)
    .order('rank', { ascending: true })

  if (!votes) return { votes: [], counts: [], total: 0, uniqueVoters: 0 }

  // Sumar puntos por jugador (weighted)
  const pointsMap = new Map<string, number>()
  for (const v of votes) {
    const pid = v.target_player_id
    const pts = (v as { points?: number }).points ?? 1
    pointsMap.set(pid, (pointsMap.get(pid) ?? 0) + pts)
  }

  // Votantes únicos
  const uniqueVoters = new Set(votes.map((v) => v.voter_id)).size

  // Total de puntos para porcentaje
  const totalPoints = Array.from(pointsMap.values()).reduce((a, b) => a + b, 0)

  // Obtener jugadoras
  const playerIds = Array.from(pointsMap.keys())
  const { data: players } = await supabase
    .from('players')
    .select('id, name, photo_url, nickname')
    .in('id', playerIds)

  const counts = (players ?? [])
    .map((p) => ({
      player_id: p.id,
      player_name: p.name,
      player_nickname: p.nickname,
      photo_url: p.photo_url,
      vote_count: pointsMap.get(p.id) ?? 0,
      percentage: totalPoints > 0 ? Math.round(((pointsMap.get(p.id) ?? 0) / totalPoints) * 100) : 0,
    }))
    .sort((a, b) => b.vote_count - a.vote_count)

  return { votes, counts, total: uniqueVoters, uniqueVoters }
}

export async function setTopNominated(sessionId: string, n: number = 4) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { counts } = await getVoteResults(sessionId)
  const topN = counts.slice(0, n).map((c) => c.player_id)

  if (topN.length === 0) return { error: 'No hay votos registrados.' }

  const { error } = await supabase
    .from('players')
    .update({ status: 'nominated' })
    .in('id', topN)

  if (error) return { error: error.message }

  revalidatePath('/admin/jugadores')
  revalidatePath('/casa')
  revalidatePath('/jugadores')
  return { success: true, playerIds: topN }
}

// ============================================================
// CSV EXPORT
// ============================================================

export async function exportVotesCSV(sessionId: string) {
  await requireAdmin()
  const { votes, counts } = await getVoteResults(sessionId)

  // Generar CSV de detalle
  const csvRows = [
    ['Votante', 'Jugadora votada', 'Motivo', 'Fecha'],
    ...(votes as Array<{
      voter: { display_name?: string; email?: string } | null
      target_player_id: string
      reason: string | null
      created_at: string
    }>).map((v) => [
      v.voter?.display_name ?? v.voter?.email ?? 'Anónimo',
      counts.find((c) => c.player_id === v.target_player_id)?.player_name ?? v.target_player_id,
      v.reason ?? '',
      new Date(v.created_at).toLocaleString('es-AR'),
    ]),
  ]

  return csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}
