-- Agregar cédula (ID nacional) para que el import desde CSV
-- tenga un identificador estable adicional al email.
alter table public.participants
  add column cedula text unique;

create index participants_cedula_idx on public.participants (cedula);

comment on column public.participants.cedula is
  'Cédula / ID nacional. Único cuando está presente. Importado desde CSV.';
