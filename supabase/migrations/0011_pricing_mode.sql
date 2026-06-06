-- 0011_pricing_mode.sql
-- Mode de tarification par appartement :
--   - 'monthly' (défaut) : loyer_num = loyer mensuel (comportement historique)
--   - 'stay'             : loyer_num = prix TOTAL pour un séjour daté (stay_start → stay_end)
-- Utilisé surtout pour les biens importés d'Airbnb, loués sur une période précise.

alter table properties
  add column if not exists pricing_mode text not null default 'monthly',
  add column if not exists stay_start date,
  add column if not exists stay_end date;

-- Garde-fou : valeurs autorisées
alter table properties
  drop constraint if exists properties_pricing_mode_check;
alter table properties
  add constraint properties_pricing_mode_check
  check (pricing_mode in ('monthly', 'stay'));
