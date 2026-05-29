-- Agrega campo access_days a courses (días de acceso al curso por participante)
alter table public.courses
  add column if not exists access_days integer not null default 45
  check (access_days > 0);
