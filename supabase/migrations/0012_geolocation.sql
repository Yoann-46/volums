-- 0012_geolocation.sql
-- Géolocalisation des appartements pour la carte type Airbnb (zone approximative).
--   - latitude / longitude : coordonnées du logement (géocodées depuis l'adresse)
--   - geo_address          : adresse saisie en back-office (référence interne, non
--                            affichée publiquement — seul un cercle approximatif l'est)

alter table properties
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geo_address text;
