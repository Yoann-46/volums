-- Migration 0010 — Découpe du ménage en deux types
-- 1. final_cleaning_fee   : ménage de fin de séjour (forfait, optionnel)
-- 2. weekly_cleaning_fee  : ménage hebdomadaire (prix par semaine, optionnel)
--    Le total ménage hebdo est calculé côté code : nb_semaines * weekly_cleaning_fee
--
-- L'ancien `cleaning_fee` est conservé pour compat. À la migration on copie sa valeur
-- vers `final_cleaning_fee` si ce dernier est null (cas de la résa "Jack" déjà créée
-- avec un ménage indistinct).

alter table bookings add column if not exists final_cleaning_fee  integer; -- € forfait
alter table bookings add column if not exists weekly_cleaning_fee integer; -- € / semaine

-- Recopie des données existantes : cleaning_fee → final_cleaning_fee (one-shot, idempotent)
update bookings
   set final_cleaning_fee = cleaning_fee
 where cleaning_fee is not null
   and final_cleaning_fee is null;
