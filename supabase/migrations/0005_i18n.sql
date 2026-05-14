-- Migration 0005 — Internationalisation (EN)
-- Ajoute des colonnes _en pour les champs traduisibles d'un appartement.
-- Toutes nullables : si la version EN est vide, le front affiche la version FR (fallback).
-- Champs NON traduits (intentionnel) : name, name_italic, ref, arrondissement, quartier,
-- surface, chambres, sdb, couchages, loyer_num — restent en français / unités m².

alter table properties
  add column if not exists dispo_en text,
  add column if not exists baseline_en text,
  add column if not exists short_description_en text,
  add column if not exists long_description_en text[],
  add column if not exists etage_en text,
  add column if not exists min_stay_en text,
  add column if not exists inclus_en text[];
