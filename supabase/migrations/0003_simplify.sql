-- Simplification : on retire les champs non affichés sur le site
-- À exécuter dans le SQL Editor Supabase
alter table public.properties drop column if exists price_per_sqm;
alter table public.properties drop column if exists transport;
alter table public.properties drop column if exists host_name;
alter table public.properties drop column if exists host_role;
alter table public.properties drop column if exists loyer;
-- loyer_num reste : c'est la source de vérité, formaté côté front
