-- Fija search_path en la función trigger para evitar
-- secuestro vía objetos en otros schemas (advisor 0011).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
