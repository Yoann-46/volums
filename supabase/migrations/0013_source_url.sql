-- 0013_source_url.sql
-- Conserve le lien d'origine d'une annonce importée (Airbnb / Le Collectionist).
-- Référence interne back-office uniquement — jamais affichée côté client.

alter table properties
  add column if not exists source_url text;
