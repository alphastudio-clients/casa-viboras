// ============================================================
// TYPES: La Casa de Víboras
// ============================================================

export type SeasonStatus = 'upcoming' | 'active' | 'finished'
export type PlayerStatus = 'active' | 'nominated' | 'leader' | 'eliminated' | 'saved'
export type UserRole = 'public' | 'player' | 'admin'
export type VoteType =
  | 'public_negative'
  | 'public_positive'
  | 'internal_nomination'
  | 'internal_spontaneous'
  | 'internal_leader'
  | 'internal_positive'
  | 'internal_negative'
export type VoterType = 'public' | 'players'
export type VoteSessionStatus = 'draft' | 'open' | 'closed' | 'published'
export type NominationType = 'positive' | 'negative' | 'leader'
export type ContentType =
  | 'confesionario'
  | 'momento'
  | 'clip'
  | 'meme'
  | 'gala'
  | 'lider_semanal'
  | 'ranking'
  | 'timeline'

// ============================================================
// ENTIDADES
// ============================================================

export interface Season {
  id: string
  name: string
  slug: string
  description: string | null
  edition: string | null
  status: SeasonStatus
  cover_url: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  instagram_handle: string | null
  role: UserRole
  player_id: string | null
  created_at: string
  updated_at: string
}

export interface PlayerStats {
  wins?: number
  nominations?: number
  votes_received?: number
  weeks_leader?: number
  [key: string]: number | undefined
}

export interface PlayerClip {
  title: string
  url: string
  thumbnail?: string
}

export interface Player {
  id: string
  season_id: string
  profile_id: string | null
  name: string
  nickname: string | null
  photo_url: string | null
  description: string | null
  highlight_phrase: string | null
  instagram_handle: string | null
  status: PlayerStatus
  entry_date: string | null
  elimination_date: string | null
  sort_order: number
  stats: PlayerStats
  clips: PlayerClip[]
  created_at: string
  updated_at: string
  // joins
  season?: Season
}

export interface VoteSession {
  id: string
  season_id: string
  title: string
  description: string | null
  type: VoteType
  voter_type: VoterType
  status: VoteSessionStatus
  allows_reason: boolean
  results_visible: boolean
  start_time: string | null
  end_time: string | null
  published_at: string | null
  winner_player_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joins
  season?: Season
  winner?: Player
}

export interface Vote {
  id: string
  vote_session_id: string
  voter_id: string
  target_player_id: string
  points: number
  rank: number
  reason: string | null
  created_at: string
  // joins
  voter?: Profile
  target_player?: Player
}

export interface Nomination {
  id: string
  season_id: string
  vote_session_id: string | null
  player_id: string
  type: NominationType
  round: number
  is_active: boolean
  created_at: string
  // joins
  player?: Player
}

export interface Elimination {
  id: string
  season_id: string
  player_id: string
  vote_session_id: string | null
  votes_count: number
  percentage: number | null
  notes: string | null
  eliminated_at: string
  // joins
  player?: Player
}

export interface ContentSection {
  id: string
  season_id: string
  player_id: string | null
  type: ContentType
  title: string | null
  content: string | null
  media_url: string | null
  thumbnail_url: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // joins
  player?: Player
}

export interface VoteCount {
  player_id: string
  player_name: string
  vote_count: number
  percentage: number
}

// ============================================================
// FORMS & ACTIONS
// ============================================================

export interface CreatePlayerInput {
  season_id: string
  name: string
  nickname?: string
  description?: string
  highlight_phrase?: string
  instagram_handle?: string
  status?: PlayerStatus
}

export interface CreateVoteSessionInput {
  season_id: string
  title: string
  description?: string
  type: VoteType
  voter_type: VoterType
  allows_reason?: boolean
}

export interface CastVoteInput {
  vote_session_id: string
  target_player_id: string
  reason?: string
}

export interface CastMultiVoteInput {
  vote_session_id: string
  picks: string[]   // ordered player IDs: picks[0] = 1st choice, picks[1] = 2nd, etc.
  reason?: string
}

// ============================================================
// MULTI-VOTE CONFIG
// ============================================================

/**
 * Types that require selecting multiple players with weighted points.
 * Key = vote type, Value = array of points per rank (index 0 = 1st pick, etc.)
 */
export const VOTE_WEIGHTS: Partial<Record<VoteType, number[]>> = {
  internal_nomination: [2, 1],      // 2 picks: 1st = 2pts, 2nd = 1pt
  internal_spontaneous: [3, 2, 1],  // 3 picks: 1st = 3pts, 2nd = 2pts, 3rd = 1pt
}

export function isMultiVoteType(type: VoteType): boolean {
  return type in VOTE_WEIGHTS
}

// ============================================================
// UI HELPERS
// ============================================================

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  public_negative: 'Quién querés que salga',
  public_positive: 'Quién querés que se quede',
  internal_nomination: 'Nominación',
  internal_spontaneous: 'Nominación Espontánea',
  internal_leader: 'Liderazgo',
  internal_positive: 'Placa Positiva',
  internal_negative: 'Placa Negativa',
}

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  active: 'En la casa',
  nominated: 'En placa',
  leader: 'Líder',
  eliminated: 'Eliminada',
  saved: 'Salvada',
}

export const PLAYER_STATUS_COLORS: Record<PlayerStatus, string> = {
  active: 'text-green-400 border-green-400',
  nominated: 'text-yellow-400 border-yellow-400',
  leader: 'text-pink-400 border-pink-400',
  eliminated: 'text-gray-500 border-gray-500',
  saved: 'text-blue-400 border-blue-400',
}
