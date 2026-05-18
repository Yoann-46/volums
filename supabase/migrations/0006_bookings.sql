-- Migration 0006 — Industrialisation des réservations
-- Stocke les réservations en DB (au lieu de pages HTML statiques générées à la main).
-- Le front rend la page /booking/:booking_id en lisant cette table.

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique not null,                    -- ex: VLMS-7K3MX9P2 (utilisé dans l'URL)
  property_id uuid not null references properties(id) on delete restrict,
  guest_name text not null,
  check_in date not null,
  check_out date not null,
  total_amount integer,                               -- en €, override manuel (si null, le front calcule)
  notes text,                                         -- usage interne, non affiché côté client
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_booking_id_idx on bookings(booking_id);
create index if not exists bookings_property_id_idx on bookings(property_id);

-- updated_at auto
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- RLS : lecture publique (toute personne avec le lien peut voir la confirmation),
-- écriture authentifiée seulement (admin loggé).
alter table bookings enable row level security;

drop policy if exists "bookings public read" on bookings;
create policy "bookings public read" on bookings for select using (true);

drop policy if exists "bookings authenticated write" on bookings;
create policy "bookings authenticated write" on bookings
  for all using (auth.role() = 'authenticated');

-- Seed : on rapatrie la résa "Jack" qui était jusqu'ici en HTML statique.
-- L'appart de Jack a l'id 7ebee8a6-f4dc-4f4a-adda-11cc79ea71b4 (Appt Beaumarchais, ref 4 BEAUMAR 1).
insert into bookings (booking_id, property_id, guest_name, check_in, check_out, total_amount)
values ('VLMS-7K3MX9P2', '7ebee8a6-f4dc-4f4a-adda-11cc79ea71b4', 'Jack', '2026-05-22', '2026-06-22', 7200)
on conflict (booking_id) do nothing;
