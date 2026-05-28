-- ============================================================
-- LA CASA DE VÍBORAS — Supabase Schema v1.0
-- Ejecutar en orden en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: seasons (temporadas)
-- ============================================================
CREATE TABLE public.seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  edition     TEXT,                              -- "2026", "Córdoba", etc.
  status      TEXT NOT NULL DEFAULT 'upcoming'  -- upcoming | active | finished
    CHECK (status IN ('upcoming', 'active', 'finished')),
  cover_url   TEXT,
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: profiles (usuarios públicos — sync con auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  display_name      TEXT,
  avatar_url        TEXT,
  instagram_handle  TEXT,
  role              TEXT NOT NULL DEFAULT 'public'
    CHECK (role IN ('public', 'player', 'admin')),
  player_id         UUID,                         -- FK agregada después
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: players (jugadores en la casa)
-- ============================================================
CREATE TABLE public.players (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id           UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  profile_id          UUID REFERENCES public.profiles(id),  -- si el jugador tiene cuenta
  name                TEXT NOT NULL,
  nickname            TEXT,
  photo_url           TEXT,
  description         TEXT,
  highlight_phrase    TEXT,
  instagram_handle    TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'nominated', 'leader', 'eliminated', 'saved')),
  entry_date          TIMESTAMPTZ DEFAULT NOW(),
  elimination_date    TIMESTAMPTZ,
  sort_order          INTEGER DEFAULT 0,
  stats               JSONB NOT NULL DEFAULT '{}'::jsonb,  -- wins, nominations, etc.
  clips               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{title, url}]
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK circular: profiles → players
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_player_id
  FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE SET NULL;

-- ============================================================
-- TABLA: admin_users (whitelist de admins)
-- ============================================================
CREATE TABLE public.admin_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: vote_sessions (sesiones de votación)
-- ============================================================
CREATE TABLE public.vote_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id        UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL
    CHECK (type IN (
      'public_negative',    -- público: quién sale
      'public_positive',    -- público: quién se queda
      'internal_nomination','internal_spontaneous',
      'internal_fulminating','internal_leader',
      'internal_positive',  'internal_negative'
    )),
  voter_type       TEXT NOT NULL DEFAULT 'public'
    CHECK (voter_type IN ('public', 'players')),
  status           TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'published')),
  allows_reason    BOOLEAN NOT NULL DEFAULT false,
  results_visible  BOOLEAN NOT NULL DEFAULT false,  -- admin controla cuándo se publica
  start_time       TIMESTAMPTZ,
  end_time         TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  winner_player_id UUID REFERENCES public.players(id),
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: votes (votos individuales)
-- ============================================================
CREATE TABLE public.votes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_session_id  UUID NOT NULL REFERENCES public.vote_sessions(id) ON DELETE CASCADE,
  voter_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un usuario solo puede votar una vez por sesión
  CONSTRAINT unique_vote_per_session UNIQUE (vote_session_id, voter_id)
);

-- ============================================================
-- TABLA: nominations (jugadores en placa)
-- ============================================================
CREATE TABLE public.nominations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id        UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  vote_session_id  UUID REFERENCES public.vote_sessions(id),
  player_id        UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'negative'
    CHECK (type IN ('positive', 'negative', 'leader')),
  round            INTEGER DEFAULT 1,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: eliminations (eliminados)
-- ============================================================
CREATE TABLE public.eliminations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id        UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id        UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  vote_session_id  UUID REFERENCES public.vote_sessions(id),
  votes_count      INTEGER DEFAULT 0,
  percentage       NUMERIC(5,2),
  notes            TEXT,
  eliminated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: content_sections (confesionario, clips, momentos)
-- ============================================================
CREATE TABLE public.content_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES public.players(id) ON DELETE SET NULL,
  type         TEXT NOT NULL
    CHECK (type IN (
      'confesionario','momento','clip','meme',
      'gala','lider_semanal','ranking','timeline'
    )),
  title        TEXT,
  content      TEXT,
  media_url    TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_players_season_id       ON public.players(season_id);
CREATE INDEX idx_players_status          ON public.players(status);
CREATE INDEX idx_vote_sessions_season    ON public.vote_sessions(season_id);
CREATE INDEX idx_vote_sessions_status    ON public.vote_sessions(status);
CREATE INDEX idx_votes_session_id        ON public.votes(vote_session_id);
CREATE INDEX idx_votes_voter_id          ON public.votes(voter_id);
CREATE INDEX idx_votes_target_player     ON public.votes(target_player_id);
CREATE INDEX idx_nominations_season      ON public.nominations(season_id);
CREATE INDEX idx_content_season_type     ON public.content_sections(season_id, type);

-- ============================================================
-- FUNCIÓN: sync de perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
      THEN 'admin'
      ELSE 'public'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at   = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER seasons_updated_at    BEFORE UPDATE ON public.seasons    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER profiles_updated_at   BEFORE UPDATE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER players_updated_at    BEFORE UPDATE ON public.players    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER vote_sessions_updated BEFORE UPDATE ON public.vote_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER content_sections_updated BEFORE UPDATE ON public.content_sections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: contar votos (solo admin puede llamar)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vote_counts(p_vote_session_id UUID)
RETURNS TABLE (
  player_id        UUID,
  player_name      TEXT,
  vote_count       BIGINT,
  percentage       NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id                                       AS player_id,
      p.name                                     AS player_name,
      COUNT(v.id)                                AS vote_count,
      ROUND(COUNT(v.id) * 100.0 / NULLIF(SUM(COUNT(v.id)) OVER (), 0), 2) AS percentage
    FROM public.players p
    LEFT JOIN public.votes v
      ON v.target_player_id = p.id
      AND v.vote_session_id = p_vote_session_id
    WHERE p.id IN (
      SELECT DISTINCT target_player_id FROM public.votes
      WHERE vote_session_id = p_vote_session_id
    )
    GROUP BY p.id, p.name
    ORDER BY vote_count DESC;
END;
$$;

-- ============================================================
-- FUNCIÓN: verificar si el usuario ya votó
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_user_voted(p_vote_session_id UUID, p_voter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.votes
    WHERE vote_session_id = p_vote_session_id
      AND voter_id = p_voter_id
  );
$$;
