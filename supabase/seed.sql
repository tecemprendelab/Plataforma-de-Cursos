-- ============================================================
--  Seed inicial — datos demo (cursos, tags, participantes y
--  sus relaciones N:N). Aplicado una sola vez al crear el
--  proyecto. NO re-ejecutar en producción: rompería por
--  email/code UNIQUE.
-- ============================================================

-- Tags
insert into public.tags (name, color) values
  ('Becado',       'green'),
  ('Seguimiento',  'orange'),
  ('Equipo líder', 'purple'),
  ('Empresa',      'blue'),
  ('Desertor',     'red'),
  ('Certificado',  'teal');

-- Courses
insert into public.courses (name, short, type, platform, start_date, end_date, capacity, price, modalidad, code, description, active) values
  ('Diseño Exprés: Aprendé lo básico',       'Diseño Exprés',     'curso',  'TEC Digital', '2026-02-09', '2026-03-06', 30, 32640, 'Asincrónico', 'DISENO2026',   'Fundamentos de diseño gráfico, teoría del color e identidad visual usando Canva.', true),
  ('Marketing Digital para Emprendimientos', 'Marketing Digital', 'curso',  'TEC Digital', '2026-02-09', '2026-03-06', 40, 35700, 'Asincrónico', 'MKTDIG2026',   'Estrategias de marketing digital aplicadas a emprendimientos costarricenses.',     true),
  ('Taller: Costos 2026',                    'Costos 2026',       'taller', 'TEC Digital', '2026-02-09', '2026-02-27', 35, 22440, 'Asincrónico', 'COSTOS2026',   'Cálculo de costos para productos, servicios y reventa.',                           true),
  ('Taller de Pre-incubación 2026',          'Pre-incubación',    'taller', 'Zoom',        '2026-05-22', '2026-07-03', 25, 20000, 'Sincrónico',  'PREINCUB2026', 'Proceso de pre-incubación para ideas de negocio innovadoras.',                     true);

-- Participants
insert into public.participants (name, email, phone, status, payment, access, fecha, notes) values
  ('Ana Rodríguez',    'ana.rodriguez@gmail.com',  '8800-1234', 'activo',   'pagado',    true,  '2026-04-10', null),
  ('Carlos Mora',      'carlos.mora@outlook.com',  '8711-5678', 'activo',   'pagado',    true,  '2026-04-20', null),
  ('María Jiménez',    'mjimenez@tec.ac.cr',       '8622-9101', 'activo',   'pendiente', false, '2026-05-01', 'Pendiente confirmación pago'),
  ('Luis Vargas',      'lvargas@hotmail.com',      '8533-1122', 'activo',   'pagado',    true,  '2026-03-25', null),
  ('Sofía Castro',     'sofia.castro@gmail.com',   '8844-3344', 'inactivo', 'pagado',    false, '2025-12-10', null),
  ('David Ureña',      'd.urena@empresa.cr',       '8755-5566', 'activo',   'pagado',    true,  '2026-05-10', null),
  ('Valeria Bogantes', 'vbogantes@gmail.com',      '8666-7788', 'activo',   'pendiente', false, '2026-05-05', null),
  ('Andrés Solano',    'asolano@tec.ac.cr',        '8877-9900', 'activo',   'pagado',    true,  '2026-05-15', 'Equipo líder');

-- participant_courses (resueltas por email + code)
insert into public.participant_courses (participant_id, course_id)
select p.id, c.id from public.participants p, public.courses c
where (p.email, c.code) in (
  ('ana.rodriguez@gmail.com',  'DISENO2026'),
  ('ana.rodriguez@gmail.com',  'MKTDIG2026'),
  ('carlos.mora@outlook.com',  'COSTOS2026'),
  ('mjimenez@tec.ac.cr',       'PREINCUB2026'),
  ('lvargas@hotmail.com',      'MKTDIG2026'),
  ('lvargas@hotmail.com',      'COSTOS2026'),
  ('sofia.castro@gmail.com',   'DISENO2026'),
  ('d.urena@empresa.cr',       'PREINCUB2026'),
  ('vbogantes@gmail.com',      'MKTDIG2026'),
  ('asolano@tec.ac.cr',        'DISENO2026'),
  ('asolano@tec.ac.cr',        'COSTOS2026'),
  ('asolano@tec.ac.cr',        'PREINCUB2026')
);

-- participant_tags (resueltas por email + tag name)
insert into public.participant_tags (participant_id, tag_id)
select p.id, t.id from public.participants p, public.tags t
where (p.email, t.name) in (
  ('ana.rodriguez@gmail.com',  'Seguimiento'),
  ('ana.rodriguez@gmail.com',  'Certificado'),
  ('carlos.mora@outlook.com',  'Certificado'),
  ('mjimenez@tec.ac.cr',       'Becado'),
  ('lvargas@hotmail.com',      'Empresa'),
  ('lvargas@hotmail.com',      'Seguimiento'),
  ('sofia.castro@gmail.com',   'Desertor'),
  ('d.urena@empresa.cr',       'Empresa'),
  ('vbogantes@gmail.com',      'Becado'),
  ('vbogantes@gmail.com',      'Equipo líder'),
  ('asolano@tec.ac.cr',        'Equipo líder'),
  ('asolano@tec.ac.cr',        'Certificado')
);
