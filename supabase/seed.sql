-- ============================================================
-- SEED: datos iniciales para desarrollo
-- ============================================================

-- Temporada inicial
INSERT INTO public.seasons (id, name, slug, description, edition, status, start_date)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'La Casa de Víboras 2026',
  'viboras-2026',
  'La primera edición de La Casa de Víboras. Las Víboras Rosas se miden dentro de la casa.',
  '2026',
  'active',
  NOW()
);

-- Admin inicial (reemplazar con tu email real)
-- Nota: el perfil se crea automáticamente cuando hacés login por primera vez.
-- Después de tu primer login, ejecutá:
-- INSERT INTO public.admin_users (email, notes)
-- VALUES ('tu@email.com', 'Admin principal');

-- Jugadoras demo
INSERT INTO public.players (season_id, name, nickname, description, status, highlight_phrase, sort_order)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Valentina López', 'La Vale', 'Capitana de las Víboras. Ágil, estratégica y siempre al mando.', 'active', 'En la cancha y en la casa, siempre al frente.', 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sofía Martínez', 'La Sofi', 'La más ruidosa de la casa. Nunca se calla lo que piensa.', 'active', 'El silencio no es mi estilo.', 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Camila García', 'Cami', 'Estratega nata. Sonríe siempre pero no pierde de vista nada.', 'nominated', 'Que subestimen, que me conviene.', 3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Lucía Fernández', 'Lu', 'La más nueva de la casa. Llegó sin hacer ruido, pero ya todos la miran.', 'active', 'Vine a aprender y me quedé a ganar.', 4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Antonella Ruiz', 'Toni', 'Líder natural. Tiene el don de unir o dividir con una sola frase.', 'leader', 'Lo que digo yo, va.', 5),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Micaela Torres', 'Mica', 'La más tranquila, pero cuando explota... la casa tiembla.', 'active', 'Calma antes de la tormenta.', 6);
