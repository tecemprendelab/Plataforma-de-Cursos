-- ============================================================
--  Ajusta los días de acceso (access_days) por curso/taller.
--  El acceso de cada participante usa el MÁXIMO access_days
--  entre los cursos en los que está inscrito.
--
--    Pre-incubación ............ 6 semanas = 42 días
--    Marketing / Diseño / Costos ............... 45 días
--    FIDEIMAS .................. 4 semanas = 28 días
--
--  Se hace match por nombre/short/código (case-insensitive).
--  Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- Taller de Pre-incubación → 42 días
UPDATE courses SET access_days = 42
WHERE name  ILIKE '%pre-incubaci%'
   OR name  ILIKE '%preincubaci%'
   OR short ILIKE '%pre-incub%'
   OR code  ILIKE '%preincub%';

-- FIDEIMAS → 28 días
UPDATE courses SET access_days = 28
WHERE name  ILIKE '%fideimas%'
   OR short ILIKE '%fideimas%'
   OR code  ILIKE '%fideimas%';

-- Marketing, Diseño y Costos → 45 días
UPDATE courses SET access_days = 45
WHERE name ILIKE '%marketing%'
   OR name ILIKE '%dise%'        -- Diseño
   OR name ILIKE '%costos%';
