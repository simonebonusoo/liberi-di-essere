-- =============================================================================
-- BNS Studio — Gestionale Parrucchiere
-- Schema completo Supabase: tabelle, foreign key, RLS, trigger, seed.
-- Copia/incolla TUTTO questo file in: Supabase Dashboard -> SQL Editor -> Run.
-- È idempotente: puoi rilanciarlo senza rompere nulla.
-- =============================================================================

-- Estensioni necessarie -------------------------------------------------------
create extension if not exists "pgcrypto";     -- gen_random_uuid()
create extension if not exists "btree_gist";    -- exclusion constraint anti-overlap

-- =============================================================================
-- 1. ENUM
-- =============================================================================
do $$ begin
  create type user_role as enum ('client', 'salon_admin', 'super_admin', 'admin');
exception when duplicate_object then null; end $$;
alter type user_role add value if not exists 'salon_admin';
alter type user_role add value if not exists 'super_admin';

do $$ begin
  create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');
exception when duplicate_object then null; end $$;
alter type appointment_status add value if not exists 'pending';
alter type appointment_status add value if not exists 'no_show';
alter type appointment_status add value if not exists 'rescheduled';

do $$ begin
  create type notification_type as enum ('booking_created', 'booking_cancelled', 'booking_updated', 'booking_reminder', 'system');
exception when duplicate_object then null; end $$;
alter type notification_type add value if not exists 'booking_updated';

do $$ begin
  create type notification_delivery_status as enum ('pending', 'sent', 'failed', 'demo_simulated');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- 2. TABELLE
-- =============================================================================

-- profiles: estende auth.users con dati anagrafici e ruolo -------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '',
  email       text        not null default '',
  phone       text,
  role        user_role   not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- services -------------------------------------------------------------------
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null,
  description      text        not null default '',
  category         text        not null default 'Generale',
  duration_minutes int         not null check (duration_minutes > 0 and duration_minutes <= 600),
  buffer_minutes   int         not null default 10 check (buffer_minutes >= 0 and buffer_minutes <= 120),
  price            numeric(10,2) not null default 0 check (price >= 0),
  price_from       boolean     not null default true,
  image_url        text,
  location_ids     uuid[]      not null default '{}',
  staff_ids        uuid[]      not null default '{}',
  preliminary_questions text[] not null default '{}',
  public_visible   boolean     not null default true,
  notes            text        not null default '',
  active           boolean     not null default true,
  sort_order       int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.services add column if not exists buffer_minutes int not null default 10 check (buffer_minutes >= 0 and buffer_minutes <= 120);
alter table public.services add column if not exists price_from boolean not null default true;
alter table public.services add column if not exists location_ids uuid[] not null default '{}';
alter table public.services add column if not exists staff_ids uuid[] not null default '{}';
alter table public.services add column if not exists preliminary_questions text[] not null default '{}';
alter table public.services add column if not exists public_visible boolean not null default true;
alter table public.services add column if not exists notes text not null default '';

-- locations ------------------------------------------------------------------
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null default '',
  directions  text not null default '',
  phone       text,
  email       text,
  map_url     text,
  image_url   text,
  active      boolean not null default true,
  seasonal    boolean not null default false,
  show_when_inactive boolean not null default false,
  season_start date,
  season_end   date,
  max_simultaneous_appointments int not null default 1 check (max_simultaneous_appointments > 0),
  info_message text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (season_end is null or season_start is null or season_end >= season_start)
);

-- staff_members --------------------------------------------------------------
create table if not exists public.staff_members (
  id          uuid primary key default gen_random_uuid(),
  full_name   text        not null,
  role_title  text        not null default 'Hair Stylist',
  bio         text        not null default '',
  avatar_url  text,
  skills      text[]      not null default '{}',
  location_ids uuid[]     not null default '{}',
  service_ids uuid[]      not null default '{}',
  active      boolean     not null default true,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.staff_members add column if not exists skills text[] not null default '{}';
alter table public.staff_members add column if not exists location_ids uuid[] not null default '{}';
alter table public.staff_members add column if not exists service_ids uuid[] not null default '{}';

-- staff_availability: orari di lavoro settimanali per membro -----------------
-- weekday: 0 = domenica ... 6 = sabato (compatibile con Date.getDay()).
create table if not exists public.staff_availability (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
alter table public.staff_availability add column if not exists location_id uuid references public.locations(id) on delete cascade;
create index if not exists idx_staff_availability_staff on public.staff_availability(staff_id);
create index if not exists idx_staff_availability_location on public.staff_availability(location_id);

create or replace function public.prevent_staff_availability_overlap()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1
    from public.staff_availability existing
    where existing.id <> coalesce(new.id, gen_random_uuid())
      and existing.staff_id = new.staff_id
      and coalesce(existing.location_id, '00000000-0000-0000-0000-000000000000'::uuid) =
          coalesce(new.location_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and existing.weekday = new.weekday
      and new.start_time < existing.end_time
      and new.end_time > existing.start_time
  ) then
    raise exception 'Fascia oraria sovrapposta o duplicata';
  end if;
  return new;
end $$;

drop trigger if exists trg_staff_availability_no_overlap on public.staff_availability;
create trigger trg_staff_availability_no_overlap
  before insert or update on public.staff_availability
  for each row execute function public.prevent_staff_availability_overlap();

-- salon_closures: chiusure salone o ferie di un singolo membro ---------------
-- staff_id NULL => chiusura dell'intero salone.
create table if not exists public.salon_closures (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid references public.staff_members(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  reason     text not null default 'Chiusura',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
alter table public.salon_closures add column if not exists location_id uuid references public.locations(id) on delete cascade;

-- appointments ---------------------------------------------------------------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  staff_id    uuid not null references public.staff_members(id) on delete restrict,
  service_id  uuid not null references public.services(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict default '33333333-3333-3333-3333-333333333301',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      appointment_status not null default 'confirmed',
  price       numeric(10,2) not null default 0,
  notes       text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.appointments add column if not exists location_id uuid not null references public.locations(id) on delete restrict default '33333333-3333-3333-3333-333333333301';
create index if not exists idx_appointments_client on public.appointments(client_id);
create index if not exists idx_appointments_staff  on public.appointments(staff_id);
create index if not exists idx_appointments_starts on public.appointments(starts_at);

-- Anti double-booking a livello DB: nessun overlap tra appuntamenti CONFERMATI
-- dello stesso staff. Ultima barriera oltre al controllo applicativo.
alter table public.appointments drop constraint if exists appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'));

-- notifications --------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  message        text not null default '',
  type           notification_type not null default 'system',
  entity_type    text,
  entity_id      text,
  route          text,
  action_url     text,
  metadata       jsonb not null default '{}'::jsonb,
  delivery_status notification_delivery_status not null default 'pending',
  read           boolean not null default false,
  read_at        timestamptz,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at     timestamptz not null default now()
);
alter table public.notifications add column if not exists delivery_status notification_delivery_status not null default 'pending';
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id text;
alter table public.notifications add column if not exists route text;
alter table public.notifications add column if not exists action_url text;
alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists read_at timestamptz;

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null default '',
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  url text not null,
  kind text not null default 'image',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, read);

-- =============================================================================
-- 3. FUNZIONI DI SUPPORTO
-- =============================================================================

-- updated_at automatico
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();
drop trigger if exists trg_staff_updated on public.staff_members;
create trigger trg_staff_updated before update on public.staff_members
  for each row execute function public.set_updated_at();
drop trigger if exists trg_appointments_updated on public.appointments;
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();

-- is_admin(): controllo ruolo SENZA ricorsione RLS (security definer) ---------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'salon_admin', 'super_admin')
  );
$$;

-- handle_new_user(): crea automaticamente il profilo alla registrazione -------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    'client'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- notify_appointment(): genera notifiche interne su creazione/cancellazione ---
create or replace function public.notify_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_name text;
  v_client_name  text;
  v_when         text;
  admin_rec      record;
begin
  select name into v_service_name from public.services where id = new.service_id;
  select coalesce(nullif(full_name, ''), email) into v_client_name
    from public.profiles where id = new.client_id;
  v_when := to_char(new.starts_at, 'DD/MM/YYYY HH24:MI');

  -- Nuovo appuntamento
  if (tg_op = 'INSERT') then
    insert into public.notifications (user_id, title, message, type, entity_type, entity_id, route, metadata, delivery_status, appointment_id)
    values (new.client_id,
            'Prenotazione confermata',
            format('%s il %s è confermato.', v_service_name, v_when),
            'booking_created',
            'appointment',
            new.id::text,
            '/dashboard/appuntamenti?appointment=' || new.id::text,
            jsonb_build_object('starts_at', new.starts_at, 'location_id', new.location_id),
            'pending',
            new.id);

    for admin_rec in select id from public.profiles where role in ('admin', 'salon_admin', 'super_admin') loop
      insert into public.notifications (user_id, title, message, type, entity_type, entity_id, route, metadata, delivery_status, appointment_id)
      values (admin_rec.id,
              'Nuova prenotazione',
              format('%s ha prenotato %s per il %s.', v_client_name, v_service_name, v_when),
              'booking_created',
              'appointment',
              new.id::text,
              '/admin/calendario?appointment=' || new.id::text,
              jsonb_build_object('starts_at', new.starts_at, 'location_id', new.location_id),
              'pending',
              new.id);
    end loop;

  -- Cancellazione
  elsif (tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled') then
    insert into public.notifications (user_id, title, message, type, entity_type, entity_id, route, metadata, delivery_status, appointment_id)
    values (new.client_id,
            'Prenotazione cancellata',
            format('%s del %s è stato annullato.', v_service_name, v_when),
            'booking_cancelled',
            'appointment',
            new.id::text,
            '/dashboard/appuntamenti?appointment=' || new.id::text,
            jsonb_build_object('starts_at', new.starts_at, 'location_id', new.location_id),
            'pending',
            new.id);

    for admin_rec in select id from public.profiles where role in ('admin', 'salon_admin', 'super_admin') loop
      insert into public.notifications (user_id, title, message, type, entity_type, entity_id, route, metadata, delivery_status, appointment_id)
      values (admin_rec.id,
              'Prenotazione cancellata',
              format('%s ha annullato %s del %s.', v_client_name, v_service_name, v_when),
              'booking_cancelled',
              'appointment',
              new.id::text,
              '/admin/calendario?appointment=' || new.id::text,
              jsonb_build_object('starts_at', new.starts_at, 'location_id', new.location_id),
              'pending',
              new.id);
    end loop;
  end if;

  return new;
end $$;

drop trigger if exists trg_notify_appointment_ins on public.appointments;
create trigger trg_notify_appointment_ins
  after insert on public.appointments
  for each row execute function public.notify_appointment();

drop trigger if exists trg_notify_appointment_upd on public.appointments;
create trigger trg_notify_appointment_upd
  after update on public.appointments
  for each row execute function public.notify_appointment();

-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles           enable row level security;
alter table public.services           enable row level security;
alter table public.locations          enable row level security;
alter table public.staff_members      enable row level security;
alter table public.staff_availability enable row level security;
alter table public.salon_closures     enable row level security;
alter table public.appointments       enable row level security;
alter table public.notifications      enable row level security;
alter table public.settings           enable row level security;
alter table public.content_sections   enable row level security;
alter table public.media              enable row level security;
alter table public.audit_logs         enable row level security;

-- ---- profiles --------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- ---- services (lettura pubblica, scrittura solo admin) ---------------------
drop policy if exists "services_select_all" on public.services;
create policy "services_select_all" on public.services
  for select using (true);
drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- locations / content (lettura pubblica, scrittura admin) ---------------
drop policy if exists "locations_select_all" on public.locations;
create policy "locations_select_all" on public.locations
  for select using (true);
drop policy if exists "locations_write_admin" on public.locations;
create policy "locations_write_admin" on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_select_all" on public.settings;
create policy "settings_select_all" on public.settings
  for select using (true);
drop policy if exists "settings_write_admin" on public.settings;
create policy "settings_write_admin" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_select_all" on public.content_sections;
create policy "content_select_all" on public.content_sections
  for select using (true);
drop policy if exists "content_write_admin" on public.content_sections;
create policy "content_write_admin" on public.content_sections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media_select_all" on public.media;
create policy "media_select_all" on public.media
  for select using (true);
drop policy if exists "media_write_admin" on public.media;
create policy "media_write_admin" on public.media
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "audit_select_super_admin" on public.audit_logs;
create policy "audit_select_super_admin" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );
drop policy if exists "audit_insert_admin" on public.audit_logs;
create policy "audit_insert_admin" on public.audit_logs
  for insert with check (public.is_admin());

-- ---- staff_members ---------------------------------------------------------
drop policy if exists "staff_select_all" on public.staff_members;
create policy "staff_select_all" on public.staff_members
  for select using (true);
drop policy if exists "staff_write_admin" on public.staff_members;
create policy "staff_write_admin" on public.staff_members
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- staff_availability ----------------------------------------------------
drop policy if exists "availability_select_all" on public.staff_availability;
create policy "availability_select_all" on public.staff_availability
  for select using (true);
drop policy if exists "availability_write_admin" on public.staff_availability;
create policy "availability_write_admin" on public.staff_availability
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- salon_closures --------------------------------------------------------
drop policy if exists "closures_select_all" on public.salon_closures;
create policy "closures_select_all" on public.salon_closures
  for select using (true);
drop policy if exists "closures_write_admin" on public.salon_closures;
create policy "closures_write_admin" on public.salon_closures
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- appointments ----------------------------------------------------------
-- Il cliente vede i propri; l'admin vede tutto.
drop policy if exists "appt_select_own_or_admin" on public.appointments;
create policy "appt_select_own_or_admin" on public.appointments
  for select using (client_id = auth.uid() or public.is_admin());

-- Il cliente crea prenotazioni per sé; l'admin per chiunque.
drop policy if exists "appt_insert_self_or_admin" on public.appointments;
create policy "appt_insert_self_or_admin" on public.appointments
  for insert with check (
    public.is_admin()
    or (client_id = auth.uid() and starts_at > now())
  );

-- Il cliente può aggiornare (es. cancellare) i propri; l'admin tutto.
drop policy if exists "appt_update_own_or_admin" on public.appointments;
create policy "appt_update_own_or_admin" on public.appointments
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());

-- Solo admin può eliminare fisicamente.
drop policy if exists "appt_delete_admin" on public.appointments;
create policy "appt_delete_admin" on public.appointments
  for delete using (public.is_admin());

-- ---- notifications ---------------------------------------------------------
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- L'inserimento avviene solo via trigger security-definer: nessuna policy insert.

-- =============================================================================
-- 5. SEED — dati demo Liberi di Essere
-- =============================================================================
insert into public.locations (id, name, address, directions, phone, email, map_url, image_url, active, seasonal, show_when_inactive, season_start, season_end, max_simultaneous_appointments, info_message, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'Liberi di Essere - Copertino', 'Via Madonna delle Grazie 102, 73043 Copertino LE', 'Sede principale. CAP demo verificato: 73043.', '+39 000 0000000', 'demo@liberidiessere.bnsstudio.it', 'https://www.google.com/maps?q=Via+Madonna+delle+Grazie+102+73043+Copertino+LE', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82', true, false, true, null, null, 3, 'Sede principale demo. Telefono, email e orari ufficiali da confermare.', 1),
  ('33333333-3333-3333-3333-333333333302', 'Liberi di Essere - Sant’Isidoro', 'Sant’Isidoro, vicino al Bar Orange', 'Indirizzo provvisorio: non inventare via e civico finché non forniti.', '+39 000 0000000', 'demo@liberidiessere.bnsstudio.it', null, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=82', false, true, true, date '2026-06-15', date '2026-09-15', 2, 'Sede stagionale demo. Il periodo di apertura deve essere confermato.', 2)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  directions = excluded.directions,
  active = excluded.active,
  seasonal = excluded.seasonal,
  show_when_inactive = excluded.show_when_inactive,
  info_message = excluded.info_message;

insert into public.staff_members (id, full_name, role_title, bio, avatar_url, skills, location_ids, sort_order) values
  ('22222222-2222-2222-2222-222222222201', 'Stefania', 'Operatrice principale', 'Operatrice principale reale indicata dal cliente. Bio e foto ufficiali da confermare.', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=700&q=82', array['Taglio','Piega','Colore','Schiariture','Acconciature'], array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], 1),
  ('22222222-2222-2222-2222-222222222202', 'Davide', 'Hair stylist demo', 'Dato dimostrativo modificabile o eliminabile dalla dashboard.', 'https://images.unsplash.com/photo-1582893561942-d61adcb2e534?auto=format&fit=crop&w=700&q=82', array['Taglio','Piega','Trattamenti'], array['33333333-3333-3333-3333-333333333301'::uuid], 2),
  ('22222222-2222-2222-2222-222222222203', 'Giulia', 'Colorist demo', 'Dato dimostrativo per colore, schiariture, pieghe e acconciature.', 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=700&q=82', array['Piega','Colore','Schiariture','Acconciature'], array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], 3)
on conflict (id) do update set
  full_name = excluded.full_name,
  role_title = excluded.role_title,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  skills = excluded.skills,
  location_ids = excluded.location_ids;

insert into public.services (id, name, description, category, duration_minutes, buffer_minutes, price, price_from, image_url, location_ids, staff_ids, notes, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Taglio donna', 'Servizio demo con prezzo e durata indicativi.', 'Taglio', 45, 10, 32, true, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222202'::uuid], 'Dati demo da confermare con il cliente.', 1),
  ('11111111-1111-1111-1111-111111111102', 'Taglio e piega', 'Servizio demo con prezzo e durata indicativi.', 'Taglio', 75, 10, 42, true, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222202'::uuid], 'Dati demo da confermare con il cliente.', 2),
  ('11111111-1111-1111-1111-111111111108', 'Piega con onde', 'Servizio demo con prezzo e durata indicativi.', 'Piega', 50, 10, 32, true, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222203'::uuid], 'Dati demo da confermare con il cliente.', 8),
  ('11111111-1111-1111-1111-111111111110', 'Colore ricrescita', 'Servizio demo con prezzo e durata indicativi.', 'Colore', 90, 10, 45, true, 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222203'::uuid], 'Dati demo da confermare con il cliente.', 10),
  ('11111111-1111-1111-1111-111111111116', 'Balayage', 'Servizio demo con prezzo e durata indicativi.', 'Tecniche di schiaritura', 170, 10, 95, true, 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222203'::uuid], 'Dati demo da confermare con il cliente.', 16),
  ('11111111-1111-1111-1111-111111111120', 'Trattamento ristrutturante', 'Servizio demo con prezzo e durata indicativi.', 'Trattamenti', 45, 10, 34, true, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222202'::uuid,'22222222-2222-2222-2222-222222222203'::uuid], 'Dati demo da confermare con il cliente.', 20),
  ('11111111-1111-1111-1111-111111111125', 'Acconciatura evento', 'Servizio demo con prezzo e durata indicativi.', 'Acconciature', 90, 10, 70, true, 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=82', array['33333333-3333-3333-3333-333333333301'::uuid,'33333333-3333-3333-3333-333333333302'::uuid], array['22222222-2222-2222-2222-222222222201'::uuid,'22222222-2222-2222-2222-222222222203'::uuid], 'Dati demo da confermare con il cliente.', 25)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  duration_minutes = excluded.duration_minutes,
  price = excluded.price,
  price_from = excluded.price_from,
  location_ids = excluded.location_ids,
  staff_ids = excluded.staff_ids,
  notes = excluded.notes;

-- Orari di lavoro demo: martedì-sabato 08:30-13:00 e 15:30-19:30.
insert into public.staff_availability (staff_id, location_id, weekday, start_time, end_time)
select s.id, l.id, d.weekday, d.start_time, d.end_time
from public.staff_members s
join public.locations l on l.id = any(s.location_ids)
cross join (values
  (2, time '08:30', time '13:00'), (2, time '15:30', time '19:30'),
  (3, time '08:30', time '13:00'), (3, time '15:30', time '19:30'),
  (4, time '08:30', time '13:00'), (4, time '15:30', time '19:30'),
  (5, time '08:30', time '13:00'), (5, time '15:30', time '19:30'),
  (6, time '08:30', time '13:00'), (6, time '15:30', time '19:30')
) as d(weekday, start_time, end_time)
where not exists (
  select 1 from public.staff_availability a
  where a.staff_id = s.id and a.location_id = l.id and a.weekday = d.weekday and a.start_time = d.start_time
);

insert into public.settings (key, value) values
  ('brand', '{"salon_name":"Liberi di Essere","logo_text":"Liberi di Essere","favicon_url":"/favicon.svg","primary_color":"#2f665f","accent_color":"#d8a48f","booking_message":"Ambiente demo: le prenotazioni non rappresentano appuntamenti reali presso il salone."}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- =============================================================================
-- FINE. Account demo: crea gli utenti in Supabase Auth e assegna i ruoli:
--   update public.profiles set role = 'super_admin' where email = 'superadmin@demo.it';
--   update public.profiles set role = 'salon_admin' where email = 'admin@demo.it';
-- =============================================================================
