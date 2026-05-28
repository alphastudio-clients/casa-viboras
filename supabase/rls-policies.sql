-- ============================================================
-- LA CASA DE VÍBORAS — Row Level Security Policies
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ============================================================
-- Habilitar RLS en todas las tablas
-- ============================================================
ALTER TABLE public.seasons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eliminations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: verificar si el usuario autenticado es admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- HELPER: verificar si el usuario es jugador activo
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_player()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'player'
  );
$$;

-- ============================================================
-- SEASONS — políticas
-- ============================================================
CREATE POLICY "seasons_public_select"
  ON public.seasons FOR SELECT
  USING (true);

CREATE POLICY "seasons_admin_all"
  ON public.seasons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PROFILES — políticas
-- ============================================================
-- Cada usuario ve su propio perfil
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- Cada usuario actualiza su propio perfil
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- El trigger de auth crea el perfil (SECURITY DEFINER lo maneja)
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PLAYERS — políticas
-- ============================================================
-- Todos pueden ver jugadores activos/no eliminados
CREATE POLICY "players_public_select"
  ON public.players FOR SELECT
  USING (true);

-- Solo admin puede crear/editar/eliminar
CREATE POLICY "players_admin_all"
  ON public.players FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ADMIN_USERS — políticas
-- ============================================================
CREATE POLICY "admin_users_admin_only"
  ON public.admin_users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- VOTE_SESSIONS — políticas
-- ============================================================
-- Público puede ver sesiones abiertas o publicadas
CREATE POLICY "vote_sessions_public_select"
  ON public.vote_sessions FOR SELECT
  USING (
    status IN ('open', 'published')
    OR public.is_admin()
    OR (voter_type = 'players' AND public.is_player())
  );

-- Solo admin gestiona sesiones
CREATE POLICY "vote_sessions_admin_all"
  ON public.vote_sessions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- VOTES — políticas (las más críticas)
-- ============================================================

-- Un usuario puede ver SU PROPIO voto
CREATE POLICY "votes_own_select"
  ON public.votes FOR SELECT
  USING (voter_id = auth.uid() OR public.is_admin());

-- Insertar: solo si la sesión está abierta, el usuario es el voter y no votó antes
CREATE POLICY "votes_insert_authenticated"
  ON public.votes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND voter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.vote_sessions vs
      WHERE vs.id = vote_session_id
        AND vs.status = 'open'
    )
    AND NOT public.has_user_voted(vote_session_id, auth.uid())
  );

-- Nadie puede actualizar votos
CREATE POLICY "votes_no_update"
  ON public.votes FOR UPDATE
  USING (false);

-- Solo admin puede eliminar (para reset)
CREATE POLICY "votes_admin_delete"
  ON public.votes FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- NOMINATIONS — políticas
-- ============================================================
CREATE POLICY "nominations_public_select"
  ON public.nominations FOR SELECT
  USING (true);

CREATE POLICY "nominations_admin_all"
  ON public.nominations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ELIMINATIONS — políticas
-- ============================================================
CREATE POLICY "eliminations_public_select"
  ON public.eliminations FOR SELECT
  USING (true);

CREATE POLICY "eliminations_admin_all"
  ON public.eliminations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- CONTENT_SECTIONS — políticas
-- ============================================================
CREATE POLICY "content_public_select"
  ON public.content_sections FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "content_admin_all"
  ON public.content_sections FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- GRANT permisos al rol anon y authenticated
-- ============================================================
GRANT SELECT ON public.seasons          TO anon, authenticated;
GRANT SELECT ON public.players          TO anon, authenticated;
GRANT SELECT ON public.vote_sessions    TO anon, authenticated;
GRANT SELECT ON public.nominations      TO anon, authenticated;
GRANT SELECT ON public.eliminations     TO anon, authenticated;
GRANT SELECT ON public.content_sections TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.votes            TO authenticated;
GRANT SELECT ON public.votes            TO authenticated;

-- Solo service_role tiene acceso total (usado en admin server actions)
