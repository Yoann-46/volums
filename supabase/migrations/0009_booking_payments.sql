-- Migration 0009 — Extension des bookings pour gérer les paiements (acompte + solde)
-- Ajoute les coordonnées client complètes, la découpe acompte/solde, les modes de paiement
-- (stripe/virement) et les statuts par échéance. Crée aussi `availability_blocks` pour le
-- calendrier admin (blocages manuels d'un appart).
--
-- Stratégie : extension non-destructive. Tous les nouveaux champs sont NULLABLE.
-- `guest_name` est conservé pour compat avec la résa "Jack" existante ; la page admin
-- évoluera pour utiliser `guest_first_name` / `guest_last_name` en priorité.

-- ─────────────────────────── BOOKINGS — extension ───────────────────────────

-- Coordonnées client (étendues)
alter table bookings add column if not exists guest_first_name text;
alter table bookings add column if not exists guest_last_name  text;
alter table bookings add column if not exists guest_email      text;
alter table bookings add column if not exists guest_phone      text;

-- Découpe financière (montants en €, entiers — même convention que total_amount)
alter table bookings add column if not exists cleaning_fee   integer;  -- frais de ménage (optionnel)
alter table bookings add column if not exists deposit_amount integer;  -- montant de l'acompte
alter table bookings add column if not exists balance_amount integer;  -- montant du solde

-- Statut global de la réservation
-- draft        : créée par l'admin, lien pas encore envoyé
-- sent         : lien envoyé au client (WhatsApp), en attente du paiement de l'acompte
-- deposit_paid : acompte payé, solde encore dû
-- paid_full    : acompte + solde payés
-- completed    : séjour terminé
-- cancelled    : annulée (peut survenir à tout moment)
alter table bookings add column if not exists status text
  check (status in ('draft','sent','deposit_paid','paid_full','completed','cancelled'))
  default 'draft';

-- Mode de paiement par échéance (saisi par l'admin à la création)
alter table bookings add column if not exists deposit_payment_method text
  check (deposit_payment_method in ('stripe','bank_transfer'));
alter table bookings add column if not exists balance_payment_method text
  check (balance_payment_method in ('stripe','bank_transfer'));

-- Statut de paiement par échéance
alter table bookings add column if not exists deposit_status text
  check (deposit_status in ('pending','paid','refunded'))
  default 'pending';
alter table bookings add column if not exists balance_status text
  check (balance_status in ('pending','paid','refunded'))
  default 'pending';
alter table bookings add column if not exists deposit_paid_at timestamptz;
alter table bookings add column if not exists balance_paid_at timestamptz;

-- Identifiants Stripe (renseignés au moment du paiement effectif via webhook)
alter table bookings add column if not exists stripe_customer_id        text;
alter table bookings add column if not exists stripe_deposit_intent_id  text;
alter table bookings add column if not exists stripe_balance_intent_id  text;

-- Index utiles pour les vues filtrées
create index if not exists bookings_status_idx          on bookings(status);
create index if not exists bookings_check_in_idx        on bookings(check_in);
create index if not exists bookings_property_dates_idx  on bookings(property_id, check_in, check_out);

-- ─────────────────────────── AVAILABILITY BLOCKS ───────────────────────────
-- Plages bloquées manuellement par l'admin (entretien, vacances perso, etc.)
-- Distinct des bookings : on ne mélange pas les "vrais clients" et les blocages internes.

create table if not exists availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,                                            -- ex: "Travaux salle de bains", "Personnel"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint availability_blocks_dates_valid check (end_date > start_date)
);

create index if not exists availability_blocks_property_idx on availability_blocks(property_id);
create index if not exists availability_blocks_dates_idx    on availability_blocks(property_id, start_date, end_date);

-- updated_at auto (réutilise la fonction set_updated_at créée en 0006)
drop trigger if exists availability_blocks_set_updated_at on availability_blocks;
create trigger availability_blocks_set_updated_at before update on availability_blocks
  for each row execute function set_updated_at();

-- RLS
alter table availability_blocks enable row level security;

-- Lecture publique : nécessaire pour qu'une éventuelle future page de réservation
-- côté client puisse voir les dates bloquées. Pour l'instant inoffensif (juste des dates).
drop policy if exists "availability_blocks public read" on availability_blocks;
create policy "availability_blocks public read" on availability_blocks for select using (true);

drop policy if exists "availability_blocks authenticated write" on availability_blocks;
create policy "availability_blocks authenticated write" on availability_blocks
  for all using (auth.role() = 'authenticated');
