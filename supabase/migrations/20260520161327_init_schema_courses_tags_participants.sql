-- ============================================================
--  Schema inicial — TEC Emprende Lab
--  Tablas: courses, tags, participants, participant_courses,
--  participant_tags. RLS habilitado, acceso solo a usuarios
--  autenticados (admin único).
-- ============================================================

-- ---------- updated_at trigger function ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- courses ----------
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short       text,
  type        text not null check (type in ('curso','taller','seminario','bootcamp','charla')),
  platform    text,
  start_date  date,
  end_date    date,
  capacity    integer check (capacity is null or capacity >= 0),
  price       numeric(12,2) check (price is null or price >= 0),
  modalidad   text check (modalidad is null or modalidad in ('Asincrónico','Sincrónico','Híbrido','Presencial')),
  code        text unique,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_courses_updated
before update on public.courses
for each row execute function public.set_updated_at();

create index courses_active_idx on public.courses (active);

-- ---------- tags ----------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text not null,
  created_at timestamptz not null default now()
);

-- ---------- participants ----------
create table public.participants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique,
  phone      text,
  status     text not null check (status in ('activo','inactivo')) default 'activo',
  payment    text not null check (payment in ('pagado','pendiente')) default 'pendiente',
  access     boolean not null default false,
  fecha      date,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_participants_updated
before update on public.participants
for each row execute function public.set_updated_at();

create index participants_email_idx  on public.participants (email);
create index participants_status_idx on public.participants (status);

-- ---------- participant_courses (N:N) ----------
create table public.participant_courses (
  participant_id uuid not null references public.participants(id) on delete cascade,
  course_id      uuid not null references public.courses(id)      on delete cascade,
  enrolled_at    timestamptz not null default now(),
  primary key (participant_id, course_id)
);

create index participant_courses_course_idx on public.participant_courses (course_id);

-- ---------- participant_tags (N:N) ----------
create table public.participant_tags (
  participant_id uuid not null references public.participants(id) on delete cascade,
  tag_id         uuid not null references public.tags(id)         on delete cascade,
  primary key (participant_id, tag_id)
);

create index participant_tags_tag_idx on public.participant_tags (tag_id);

-- ---------- RLS ----------
alter table public.courses             enable row level security;
alter table public.tags                enable row level security;
alter table public.participants        enable row level security;
alter table public.participant_courses enable row level security;
alter table public.participant_tags    enable row level security;

-- Policies: solo usuarios autenticados (admin único)
-- courses
create policy "courses_authenticated_select" on public.courses
  for select to authenticated using (true);
create policy "courses_authenticated_insert" on public.courses
  for insert to authenticated with check (true);
create policy "courses_authenticated_update" on public.courses
  for update to authenticated using (true) with check (true);
create policy "courses_authenticated_delete" on public.courses
  for delete to authenticated using (true);

-- tags
create policy "tags_authenticated_select" on public.tags
  for select to authenticated using (true);
create policy "tags_authenticated_insert" on public.tags
  for insert to authenticated with check (true);
create policy "tags_authenticated_update" on public.tags
  for update to authenticated using (true) with check (true);
create policy "tags_authenticated_delete" on public.tags
  for delete to authenticated using (true);

-- participants
create policy "participants_authenticated_select" on public.participants
  for select to authenticated using (true);
create policy "participants_authenticated_insert" on public.participants
  for insert to authenticated with check (true);
create policy "participants_authenticated_update" on public.participants
  for update to authenticated using (true) with check (true);
create policy "participants_authenticated_delete" on public.participants
  for delete to authenticated using (true);

-- participant_courses
create policy "pc_authenticated_select" on public.participant_courses
  for select to authenticated using (true);
create policy "pc_authenticated_insert" on public.participant_courses
  for insert to authenticated with check (true);
create policy "pc_authenticated_update" on public.participant_courses
  for update to authenticated using (true) with check (true);
create policy "pc_authenticated_delete" on public.participant_courses
  for delete to authenticated using (true);

-- participant_tags
create policy "pt_authenticated_select" on public.participant_tags
  for select to authenticated using (true);
create policy "pt_authenticated_insert" on public.participant_tags
  for insert to authenticated with check (true);
create policy "pt_authenticated_update" on public.participant_tags
  for update to authenticated using (true) with check (true);
create policy "pt_authenticated_delete" on public.participant_tags
  for delete to authenticated using (true);
