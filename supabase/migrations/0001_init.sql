-- Volums - schéma initial
-- À copier-coller dans le SQL Editor de Supabase

create extension if not exists "uuid-ossp";

-- Table principale des appartements
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  ref text not null,
  dispo text not null,
  arrondissement text not null,
  quartier text not null,
  name text not null,
  name_italic text not null,
  baseline text not null,
  short_description text not null,
  long_description text[] not null default '{}',
  surface text not null,
  chambres text not null,
  sdb text not null,
  etage text not null,
  couchages text not null,
  min_stay text not null,
  loyer text not null,
  loyer_num integer not null,
  price_per_sqm text not null,
  inclus text[] not null default '{}',
  transport text not null,
  host_name text not null,
  host_role text not null,
  cover_photo_id uuid,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table des photos
create table if not exists public.property_photos (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  label text not null,
  caption text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_photos_property_id_idx
  on public.property_photos(property_id);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Storage bucket pour les photos
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- RLS
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;

-- Lecture publique
drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read" on public.properties
  for select using (is_published = true);

drop policy if exists "property_photos_public_read" on public.property_photos;
create policy "property_photos_public_read" on public.property_photos
  for select using (true);

-- Écriture pour utilisateurs authentifiés (admin)
drop policy if exists "properties_auth_all" on public.properties;
create policy "properties_auth_all" on public.properties
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "property_photos_auth_all" on public.property_photos;
create policy "property_photos_auth_all" on public.property_photos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage policies : lecture publique, écriture authentifiée
drop policy if exists "property_photos_storage_read" on storage.objects;
create policy "property_photos_storage_read" on storage.objects
  for select using (bucket_id = 'property-photos');

drop policy if exists "property_photos_storage_write" on storage.objects;
create policy "property_photos_storage_write" on storage.objects
  for insert with check (bucket_id = 'property-photos' and auth.role() = 'authenticated');

drop policy if exists "property_photos_storage_update" on storage.objects;
create policy "property_photos_storage_update" on storage.objects
  for update using (bucket_id = 'property-photos' and auth.role() = 'authenticated');

drop policy if exists "property_photos_storage_delete" on storage.objects;
create policy "property_photos_storage_delete" on storage.objects
  for delete using (bucket_id = 'property-photos' and auth.role() = 'authenticated');
