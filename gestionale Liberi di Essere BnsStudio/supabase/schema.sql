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
  create type user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('booking_created', 'booking_cancelled', 'booking_reminder', 'system');
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
  price            numeric(10,2) not null default 0 check (price >= 0),
  image_url        text,
  active           boolean     not null default true,
  sort_order       int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- staff_members --------------------------------------------------------------
create table if not exists public.staff_members (
  id          uuid primary key default gen_random_uuid(),
  full_name   text        not null,
  role_title  text        not null default 'Hair Stylist',
  bio         text        not null default '',
  avatar_url  text,
  active      boolean     not null default true,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- staff_availability: orari di lavoro settimanali per membro -----------------
-- weekday: 0 = domenica ... 6 = sabato (compatibile con Date.getDay()).
create table if not exists public.staff_availability (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_staff_availability_staff on public.staff_availability(staff_id);

-- salon_closures: chiusure salone o ferie di un singolo membro ---------------
-- staff_id NULL => chiusura dell'intero salone.
create table if not exists public.salon_closures (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid references public.staff_members(id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  reason     text not null default 'Chiusura',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- appointments ---------------------------------------------------------------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  staff_id    uuid not null references public.staff_members(id) on delete restrict,
  service_id  uuid not null references public.services(id) on delete restrict,
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
  ) where (status = 'confirmed');

-- notifications --------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  message        text not null default '',
  type           notification_type not null default 'system',
  read           boolean not null default false,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at     timestamptz not null default now()
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
    where id = auth.uid() and role = 'admin'
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
    insert into public.notifications (user_id, title, message, type, appointment_id)
    values (new.client_id,
            'Prenotazione confermata',
            format('%s il %s è confermato.', v_service_name, v_when),
            'booking_created', new.id);

    for admin_rec in select id from public.profiles where role = 'admin' loop
      insert into public.notifications (user_id, title, message, type, appointment_id)
      values (admin_rec.id,
              'Nuova prenotazione',
              format('%s ha prenotato %s per il %s.', v_client_name, v_service_name, v_when),
              'booking_created', new.id);
    end loop;

  -- Cancellazione
  elsif (tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled') then
    insert into public.notifications (user_id, title, message, type, appointment_id)
    values (new.client_id,
            'Prenotazione cancellata',
            format('%s del %s è stato annullato.', v_service_name, v_when),
            'booking_cancelled', new.id);

    for admin_rec in select id from public.profiles where role = 'admin' loop
      insert into public.notifications (user_id, title, message, type, appointment_id)
      values (admin_rec.id,
              'Prenotazione cancellata',
              format('%s ha annullato %s del %s.', v_client_name, v_service_name, v_when),
              'booking_cancelled', new.id);
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
alter table public.staff_members      enable row level security;
alter table public.staff_availability enable row level security;
alter table public.salon_closures     enable row level security;
alter table public.appointments       enable row level security;
alter table public.notifications      enable row level security;

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
-- 5. SEED — dati demo (servizi, staff, orari)
--    Rilanciabile: usa "on conflict do nothing" dove sensato.
-- =============================================================================
insert into public.services (id, name, description, category, duration_minutes, price, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Taglio Donna', 'Taglio personalizzato con consulenza di stile.', 'Taglio', 45, 30, 1),
  ('11111111-1111-1111-1111-111111111102', 'Taglio Uomo', 'Taglio classico o moderno rifinito a rasoio.', 'Taglio', 30, 20, 2),
  ('11111111-1111-1111-1111-111111111103', 'Piega', 'Messa in piega professionale.', 'Styling', 30, 18, 3),
  ('11111111-1111-1111-1111-111111111104', 'Colore', 'Colorazione completa con prodotti premium.', 'Colore', 90, 55, 4),
  ('11111111-1111-1111-1111-111111111105', 'Colpi di Sole', 'Schiariture e balayage su misura.', 'Colore', 120, 75, 5),
  ('11111111-1111-1111-1111-111111111106', 'Trattamento Ristrutturante', 'Cura intensiva per capelli danneggiati.', 'Cura', 40, 28, 6)
on conflict (id) do nothing;

insert into public.staff_members (id, full_name, role_title, bio, sort_order) values
  ('22222222-2222-2222-2222-222222222201', 'Sara Bianchi', 'Master Stylist', 'Esperta di colore e tagli couture, 10 anni di esperienza.', 1),
  ('22222222-2222-2222-2222-222222222202', 'Marco Rossi', 'Barber & Stylist', 'Specialista in tagli uomo e styling barba.', 2),
  ('22222222-2222-2222-2222-222222222203', 'Giulia Verdi', 'Colorist', 'Tecnica del balayage e trattamenti ristrutturanti.', 3)
on conflict (id) do nothing;

-- Orari di lavoro: Mar-Ven 09-18, Sab 09-17 (weekday 2..6). Lun e Dom chiuso.
insert into public.staff_availability (staff_id, weekday, start_time, end_time)
select s.id, d.weekday, d.start_time, d.end_time
from public.staff_members s
cross join (values
  (2, time '09:00', time '18:00'),
  (3, time '09:00', time '18:00'),
  (4, time '09:00', time '18:00'),
  (5, time '09:00', time '18:00'),
  (6, time '09:00', time '17:00')
) as d(weekday, start_time, end_time)
where not exists (
  select 1 from public.staff_availability a
  where a.staff_id = s.id and a.weekday = d.weekday
);

-- =============================================================================
-- FINE. Per creare il primo ADMIN, dopo esserti registrato dall'app:
--   update public.profiles set role = 'admin' where email = 'tua@email.com';
-- =============================================================================
