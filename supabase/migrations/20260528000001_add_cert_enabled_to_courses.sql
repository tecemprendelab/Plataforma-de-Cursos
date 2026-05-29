-- Habilita generación de certificados por curso
alter table public.courses
  add column if not exists cert_enabled boolean not null default false;
